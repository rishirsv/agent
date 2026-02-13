# Working Notes

- Story: 7.0: Extract and fully clean Project Coffee_buy side_FDD .pptx
- Last attempt: Ran isolated strict pipeline extraction + strict source-text export, then reran full cleanup by pruning cleanup-quality fragments from selected lines and regenerating markdown/trace/mapping artifacts together.
- Result: Success. Provenance and fail-closed gates pass, review checklist completed as `pass`.
- Next approach: Move to the next incomplete story in PRD order.
- Gotchas: Adding metadata/coverage sections before canonical headings breaks markdown-trace sync; keep added template sections after traced content and avoid untraced bullet lines.
