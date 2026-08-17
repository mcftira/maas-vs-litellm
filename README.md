# LLM gateway döntési anyag

Belső architektúra-döntési anyag (magyar): Red Hat OpenShift AI MaaS × LiteLLM × Azure AI Foundry összevetése nagy pénzintézeti környezetre — interaktív funkciómátrix, hálózati minták (SVG), döntési widget, biztonsági rétegelemzés. Kutatás dátuma: 2026-08-17.

Tisztán statikus oldal: nincs build-lépés, nincs keretrendszer, nincs külső CDN (a betűtípusok helyben vannak az `assets/fonts/` alatt).

Helyi előnézet:

```bash
python3 -m http.server 8123
# → http://localhost:8123/
```

Deploy: GitHub Pages, a repo gyökeréből (`.nojekyll` miatt minden fájl változatlanul kiszolgálódik); az asset-hivatkozások relatívak, így a `/<repo>/` alútvonalon is működik.
