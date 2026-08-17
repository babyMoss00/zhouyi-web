# Yi Zhan · Zhouyi Liu Yao Divination

**[中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)**

A fully client-side Zhouyi (I Ching) six-line divination web app. It supports three casting methods: coin toss, number input, and time-based (Mei Hua Yi Shu), automatically generating the original hexagram, changed hexagram, mutual hexagram, Na Jia, six spirits, and self/opposing line positions. No backend, no database — just open it in a browser.

**Live demo: https://zhouyi-master.surge.sh**

---

## Features

### Three Casting Methods

| Method | Description |
|--------|-------------|
| 🪙 **Coin Toss** | Enter six toss results (6/7/8/9) or click "Cast Online" to simulate three coins |
| 🔢 **Number Input** | Enter three numbers to derive upper/lower trigrams and moving line |
| ⏰ **Time-based** | Plum Blossom method using current year, month, day, and hour numbers |

### Divination Output

- **Original Hexagram**: name, text, image, and symbol
- **Plain-language Interpretation**: one-sentence summary, keywords, core advice
- **Topic-specific Guidance**: love, career, wealth, health, exams
- **Changed Hexagram**: hexagram after moving lines transform
- **Mutual Hexagram**: inner trigram from lines 2-3-4, outer from 3-4-5
- **Na Jia & Six Relatives**: heavenly stem/branch, five elements, and six relationships for each line
- **Six Spirits**: Azure Dragon, Vermilion Bird, Hooked Chen, Flying Snake, White Tiger, Black Tortoise
- **Self/Opposing Lines**: automatic marking
- **Day Pillar**: automatically calculated daily stem/branch
- **Daily Fortune**: lucky color, number, direction, do's/don'ts, motto
- **Share Result**: generate shareable card images or copy text
- **Multi-platform Cards**: 9:16, 3:4, 1:1 aspect ratios
- **Shareable Links**: each result has a unique URL hash

---

## Tech Stack

- **Pure static frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **No backend required**: all calculations run 100% in the browser
- **No external APIs**: fully self-contained
- **Responsive design**: Apple-style glassmorphism UI for desktop and mobile

---

## File Structure

```
zhouyi-web/
├── index.html              # Main page
├── css/
│   └── style.css           # Styles (glassmorphism, animations, responsive)
├── js/
│   ├── data.js             # Trigrams / hexagrams / Na Jia / spirits / line data
│   ├── divination.js       # Core divination algorithms
│   ├── interpretation.js   # Plain interpretations and fortune extras
│   └── app.js              # UI interactions and routing
├── images/                 # Icons and assets
├── og-image.png            # Social sharing image
├── vercel.json             # Vercel deploy config
└── README.md               # This project
```

---

## Run Locally

This is a static site. No build step is needed.

```bash
cd zhouyi-web
python -m http.server 8080
# Open http://localhost:8080
```

Or:

```bash
npx serve .
```

---

## Guiding Principles

> **Divine only when in doubt; do not toy with divination.**  
> **The wise do not need to divine — they read the signs and understand.**  
> **Divination is a supplement; self-cultivation is the foundation.**  
> **One matter, one reading.**

---

## License

MIT © [babyMoss00](https://github.com/babyMoss00)
