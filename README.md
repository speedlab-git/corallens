# CoralLens

**Watch Less, Verify More: Evidence-Grounded Coral Reef Monitoring with Vision-Language Models**

Project website for a 1FAU Seed Program proposal (I-SMART + HBOI, Florida Atlantic University, 2027).
Lead PI: Ahmed Imteaj, Ph.D. (EECS, SPEED Lab). Co-PI: Bing Ouyang, Ph.D. (Harbor Branch Oceanographic Institute).

## Publish on GitHub Pages

1. Publish this folder as a repository named `corallens` (GitHub Desktop: *File → Add local repository → create a repository → Publish repository*, organization `speedlab-git`, public).
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
3. The site will be live at `https://speedlab-git.github.io/corallens/` and the demo at `https://speedlab-git.github.io/corallens/demo/`.

## Structure

```
index.html                      single-page project site (no build step)
assets/coralReef_SPEED_Lab.mp4  CoralLens teaser video (87 s, 19 MB, H.264)
assets/video-poster.jpg         poster frame for the video
assets/fig1-overview.png        Figure 1 – CoralLens pipeline
assets/demo-preview.jpg         preview image for the demo section
assets/social-card.jpg          link-preview image
demo/                           interactive app prototype (index.html, style.css, app.js, assets/)
```

## Demo

`demo/` is a static, dependency-free prototype of the CoralLens app in four steps:
add a survey video → watch less (keyframes and SAM 2 coral regions) → reason across views
(per-view VLM answers, reasoning trace, fused answer) → verified monitoring report (findings linked to frames).
Deep links: `demo/#step-1` … `demo/#step-4`.

Imagery: NOAA NCRMP East Flower Garden Banks plot T3 and HBOI Pulley Ridge ROV survey.
VLM answers, reasoning steps, and report entries in the demo are illustrative; upload and processing are not yet connected to a backend.
