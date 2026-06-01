#!/usr/bin/env node

// installer/src/main.ts
import { existsSync as existsSync3, rmSync } from "node:fs";
import { createInterface } from "node:readline";

// installer/src/channels.ts
async function fetchLatestVersion(channel) {
  const url = getChannelUrl(channel);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch version from ${url}: ${response.status} ${response.statusText}`);
  }
  const version = (await response.text()).trim();
  if (!version) {
    throw new Error(`Empty version returned from ${url}`);
  }
  return version;
}
function getChannelFromVersion(version) {
  if (version.includes("head"))
    return "head";
  if (version.includes("nightly"))
    return "nightly";
  if (version.includes("beta"))
    return "beta";
  return "latest";
}
function getChannelUrl(channel) {
  const baseUrl = process.env.TESSL_INSTALL_BASE_URL || "https://install.tessl.io";
  return `${baseUrl}/.well-known/tessl/${channel}.txt`;
}
function getBinaryUrl(version, platform) {
  const baseUrl = process.env.TESSL_INSTALL_BASE_URL || "https://install.tessl.io";
  const encodedVersion = encodeURIComponent(version);
  return `${baseUrl}/binaries/${encodedVersion}/tessl-${encodedVersion}-${platform}.tar.gz`;
}

// installer/src/download.ts
async function downloadTarball(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download binary: ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error("Response body is null");
  }
  return response.body;
}

// installer/src/extract.ts
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
async function extractTarball(stream, destination) {
  await mkdir(destination, { recursive: true });
  const tar = spawn("tar", ["-xzf", "-", "-C", destination], {
    stdio: ["pipe", "inherit", "inherit"]
  });
  if (!tar.stdin) {
    throw new Error("Failed to open tar stdin");
  }
  const tarExit = new Promise((resolve, reject) => {
    tar.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tar exited with code ${code}`));
      }
    });
    tar.on("error", reject);
  });
  await pipeline(Readable.fromWeb(stream), tar.stdin);
  await tarExit;
}

// installer/src/path.ts
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir as mkdir2,
  readdir,
  readlink,
  rename,
  rm,
  symlink,
  unlink
} from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
function getAppDataDir() {
  if (process.platform === "win32") {
    return process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local");
  }
  return process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
}
function getTesslBinPath() {
  if (process.platform === "win32") {
    return join(getAppDataDir(), "tessl", "bin", "tessl.exe");
  }
  return join(homedir(), ".local", "bin", "tessl");
}
function getVersionsDirectory() {
  return join(getAppDataDir(), "tessl", "versions");
}
function getVersionedBinPath(version, platform) {
  const base = `tessl-${version}-${platform}`;
  const name = platform.startsWith("win32") ? `${base}.exe` : base;
  return join(getVersionsDirectory(), name);
}
async function getExistingBinaryPath(tesslBinPath) {
  if (!existsSync(tesslBinPath)) {
    return null;
  }
  if (process.platform === "win32") {
    return tesslBinPath;
  }
  try {
    const target = await readlink(tesslBinPath);
    const resolvedPath = resolve(dirname(tesslBinPath), target);
    if (!existsSync(resolvedPath)) {
      return null;
    }
    return resolvedPath;
  } catch {
    return null;
  }
}
async function updateBinaryAtomic(versionedBinPath, tesslBinPath) {
  await mkdir2(dirname(tesslBinPath), { recursive: true });
  const tempPath = `${tesslBinPath}.tmp`;
  if (process.platform === "win32") {
    const oldPath = `${tesslBinPath}.old.${Date.now()}`;
    await copyFile(versionedBinPath, tempPath);
    try {
      await rename(tesslBinPath, oldPath);
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }
    try {
      await rename(tempPath, tesslBinPath);
    } catch (e) {
      try {
        await rename(oldPath, tesslBinPath);
      } catch {}
      throw e;
    }
    await pruneOldBackups(dirname(tesslBinPath), tesslBinPath);
    return;
  }
  try {
    await unlink(tempPath);
  } catch {}
  await symlink(versionedBinPath, tempPath);
  await rename(tempPath, tesslBinPath);
}
async function pruneOldBackups(binDir, tesslBinPath) {
  try {
    const prefix = `${basename(tesslBinPath)}.old.`;
    const entries = await readdir(binDir);
    for (const entry of entries) {
      if (entry.startsWith(prefix)) {
        try {
          await rm(join(binDir, entry), { force: true });
        } catch {}
      }
    }
  } catch {}
}

// installer/src/platform.ts
import { execSync } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
function getLibcVariant() {
  if (process.platform !== "linux")
    return null;
  try {
    if (existsSync2("/etc/alpine-release"))
      return "musl";
  } catch {}
  try {
    const lddOutput = execSync("ldd /bin/ls 2>/dev/null", {
      encoding: "utf-8"
    });
    if (lddOutput.includes("musl"))
      return "musl";
  } catch {}
  return "glibc";
}
function getPlatformString() {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "darwin") {
    if (arch === "arm64")
      return "darwin-arm64";
    if (arch === "x64")
      return "darwin-x64";
  }
  if (platform === "linux") {
    const variant = getLibcVariant();
    if (arch === "x64") {
      return variant === "musl" ? "linux-x64-musl" : "linux-x64";
    }
    if (arch === "arm64") {
      return variant === "musl" ? "linux-arm64-musl" : "linux-arm64";
    }
  }
  if (platform === "win32") {
    if (arch === "x64")
      return "win32-x64";
    if (arch === "arm64")
      return "win32-arm64";
  }
  return null;
}
function getPlatformDescription() {
  const platform = process.platform;
  const arch = process.arch;
  const platformNames = {
    darwin: "macOS",
    linux: "Linux",
    win32: "Windows"
  };
  const archNames = {
    arm64: "ARM64",
    x64: "x64",
    ia32: "x86"
  };
  const platformName = platformNames[platform] ?? platform;
  const archName = archNames[arch] ?? arch;
  return `${platformName} ${archName}`;
}

// installer/src/spawn.ts
import { spawn as spawn2 } from "node:child_process";
function spawnBinary(binaryPath, args) {
  const child = spawn2(binaryPath, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      TESSL_MANAGED_BY_NPM: "1"
    }
  });
  const signals = process.platform === "win32" ? ["SIGINT", "SIGTERM", "SIGBREAK"] : ["SIGINT", "SIGTERM", "SIGHUP"];
  const handlers = new Map;
  for (const signal of signals) {
    const handler = () => {
      child.kill(signal);
    };
    handlers.set(signal, handler);
    process.on(signal, handler);
  }
  child.on("exit", (code, signal) => {
    if (signal) {
      for (const [sig, handler] of handlers) {
        process.removeListener(sig, handler);
      }
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 1);
    }
  });
  child.on("error", (err) => {
    console.error(`Failed to spawn binary: ${err.message}`);
    process.exit(1);
  });
}

// installer/src/validate.ts
import { spawnSync } from "node:child_process";
function validateBinary(binaryPath) {
  try {
    const result = spawnSync(binaryPath, ["--version"], {
      stdio: "pipe",
      timeout: 1e4,
      env: {
        ...process.env,
        TESSL_AUTO_UPDATE_INTERVAL_MINUTES: "0"
      }
    });
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    if (result.status !== 0) {
      return {
        success: false,
        error: `--version exited with code ${result.status}`
      };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// installer/src/main.ts
function isInteractive() {
  return process.stdin.isTTY === true && process.stdout.isTTY === true;
}
async function promptConfirmation(message) {
  return new Promise((resolve2) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(`${message} (Y/n) `, (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      resolve2(a === "" || a === "y");
    });
  });
}
function printUnsupportedPlatformMessage() {
  console.error("Error: Unsupported platform", getPlatformDescription());
  console.error(`Tessl CLI binaries are available for:
    - macOS (ARM64, x64)
    - Linux (x64, ARM64)
    - Windows (x64, ARM64)
  `);
}
async function prepareBinary() {
  const tesslBinPath = getTesslBinPath();
  const existingBinary = await getExistingBinaryPath(tesslBinPath);
  const installerVersion = "0.81.2";
  const isTestOrDevBuild = installerVersion.includes("test") || installerVersion.includes("dev");
  let versionMismatch = false;
  if (isTestOrDevBuild && existingBinary) {
    const platform2 = getPlatformString();
    if (!platform2) {
      printUnsupportedPlatformMessage();
      return process.exit(1);
    }
    if (existingBinary !== getVersionedBinPath(installerVersion, platform2)) {
      console.log(`Test/dev build - switching to version: ${installerVersion}`);
      versionMismatch = true;
    }
  }
  if (existingBinary && !versionMismatch) {
    return tesslBinPath;
  }
  const platform = getPlatformString();
  if (!platform) {
    printUnsupportedPlatformMessage();
    return process.exit(1);
  }
  const version = isTestOrDevBuild ? installerVersion : await fetchLatestVersion(getChannelFromVersion(installerVersion));
  const versionedBinPath = getVersionedBinPath(version, platform);
  if (existsSync3(versionedBinPath)) {
    return versionedBinPath;
  }
  console.log(`Downloading ${version} for ${platform}`);
  const url = getBinaryUrl(version, platform);
  const progressInterval = setInterval(() => process.stdout.write("."), 500).unref();
  try {
    const tarballStream = await downloadTarball(url);
    const versionsDir = getVersionsDirectory();
    await extractTarball(tarballStream, versionsDir);
  } finally {
    clearInterval(progressInterval);
    console.log("");
  }
  const validation = validateBinary(versionedBinPath);
  if (!validation.success) {
    try {
      rmSync(versionedBinPath, { force: true });
    } catch {}
    throw new Error(`${validation.error}. Removed the corrupt file — please try again.`);
  }
  const shouldInstall = !isInteractive() || await promptConfirmation(`Install Tessl CLI to ${tesslBinPath}?`);
  if (shouldInstall) {
    await updateBinaryAtomic(versionedBinPath, tesslBinPath);
    if (platform.includes("musl")) {
      console.log(`
This system requires libgcc and libstdc++. Install these using your distribution's package manager.
On Alpine: apk add libgcc libstdc++
`);
    }
    return tesslBinPath;
  }
  return versionedBinPath;
}
async function main() {
  const path = await prepareBinary();
  spawnBinary(path, process.argv.slice(2));
}
main().catch((err) => {
  console.error("Unexpected error:");
  console.error(err);
  process.exit(1);
});
