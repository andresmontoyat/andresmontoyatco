# Quick 261020-baq Summary (STOPPED before commit)

Tasks 1-2 done in working tree; Task 3 (commit) NOT done. Playwright ES@320 fails page-level horizontal scroll (328/320).
Culprit is the #claude-code section (hiding it drops scrollWidth to 320), not the hero/H1 (h1 272/272). Copy untouched.
Vitest 59 files / 517 tests green; build green; cv:gen and og:gen OK; pdftotext EN/ES match.
Screenshots: hero-375-en.png, hero-375-es.png in this directory.
