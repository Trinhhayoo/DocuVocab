# Store graphics

`pnpm --filter @docuvocab/extension store:graphics` draws, with your local Chrome:

| Output | Size | Store field |
|--------|------|-------------|
| `public/icon/16.png` … `128.png` | 16, 32, 48, 128 | Extension icons; `128.png` is also the store icon |
| `store/output/promo-small-440x280.png` | 440×280 | Small promo tile |
| `store/output/promo-marquee-1400x560.png` | 1400×560 | Marquee promo tile |
| `store/output/screenshot-N-1280x800.png` | 1280×800 | Screenshots |

Colors, captions, and layouts are set in `render.mjs`. Set `CHROME_PATH` if Chrome is not in `/Applications`.

## Screenshots

1. Sign in with a demo account, so no personal email or words show.
2. Capture up to five screenshots, in this order, and save them as `store/screenshots/1.png`, `2.png`, and so on:
   1. An article with saved words highlighted.
   2. The tooltip on a highlighted word.
   3. Selected text with the **Save word** button or dialog.
   4. The toolbar popup.
   5. Anything else worth showing.
3. Run `store:graphics`. Each one is framed at 1280×800 with its caption.

Raw and framed screenshots are git-ignored, because they can show the signed-in account.
