# DGRAHAM lettering

The concept wordmark uses the actual outlines of **XBOX Original Bold**,
downloaded from the preview font file on
[the supplied Online Fonts page](https://online-fonts.com/fonts/xbox-original).
Embedded metadata identifies Lyric West, version 1.00, November 19, 2020:
**XBOX Original © Lyric West. 2020. All Rights Reserved**.

This is a fan typeface, distinct from the authenticated retail XBOX mesh.
The listing describes non-commercial and private use. That usage description
and the copyright are retained in `dgraham-font.json`; no broader license
is implied. The full TTF remains in the local parent research workspace. The
JSON subset includes only the six distinct letters required for DGRAHAM.

The input TTF's SHA-256 is
`94a31a38c8493793a05979121a6adae4b988526c1692cd3c3f8ca7d61728dab2`.
In the source Flubber repository, run `npm run font:extract -- /absolute/path/to/XboxOriginalBold.ttf` to recreate
the subset, then `npm run concepts:build` to triangulate the wordmark.
The build preserves the glyph curves and advance widths, and scales uniformly
to the retail wordmark's width. The existing green material, placement and
animation remain in use. The browser does not need to fetch or install a font.
