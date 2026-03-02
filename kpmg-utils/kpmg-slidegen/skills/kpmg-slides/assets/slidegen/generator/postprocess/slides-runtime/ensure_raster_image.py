#!/usr/bin/env python3
"""Copyright (c) OpenAI. All rights reserved.

Ensure montage inputs are already raster image files.

This runtime intentionally supports raster formats only to avoid optional
external rasterization binaries.
"""

import argparse
from os import listdir
from os.path import expanduser, isfile, join, splitext

RASTER_EXTS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".bmp",
    ".gif",
    ".tif",
    ".tiff",
    ".webp",
}

SUPPORTED_EXTS = RASTER_EXTS


def ensure_raster_image(path: str, out_dir: str | None = None) -> str:
    """Return the input path when it is a supported raster file.

    `out_dir` is accepted for API compatibility with create_montage.
    """
    _ = out_dir
    ext_lower = splitext(path)[1].lower()
    if ext_lower in RASTER_EXTS:
        return path
    raise ValueError(
        "Unsupported image format for montage (raster formats only): "
        f"{path}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Validate montage inputs are supported raster image formats."
        )
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--input_files", nargs="+", help="List of input image file paths")
    group.add_argument("--input_dir", help="Directory containing input images")
    parser.add_argument(
        "--output_dir",
        default=None,
        help=(
            "Accepted for compatibility; no files are converted or written."
        ),
    )
    args = parser.parse_args()

    if args.input_files:
        paths = [expanduser(p) for p in args.input_files]
    else:
        input_dir = expanduser(args.input_dir)
        names = listdir(input_dir)
        paths = [
            join(input_dir, f)
            for f in names
            if isfile(join(input_dir, f)) and splitext(f)[1].lower() in SUPPORTED_EXTS
        ]
        if not paths:
            raise SystemExit("No files with supported raster extensions in input_dir")

    for p in paths:
        ensure_raster_image(p, args.output_dir)


if __name__ == "__main__":
    main()
