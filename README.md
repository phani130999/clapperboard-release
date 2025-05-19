# Clapperboard V1

![Clapperboard Logo](public/assets/clapperboard.ico)

Clapperboard is a lightweight application designed to empower writers and directors with seamless scene breakdowns during the draft screenplay stage. From assessing casting needs to identifying set requirements, camera angles, lighting cues, and musical themes — Clapperboard streamlines the creative process.

With Clapperboard, you can effortlessly filter scenes by location, characters, or shot types, giving you the clarity to plan each frame with precision.

[Screenshots](https://ibb.co/album/zH2QG7)

---

## Features

- Scene breakdown management for script development  
- Filter scenes by location, characters, or shot types  
- Track casting, sets, lighting, camera angles, and music cues  
- Intuitive, minimalistic, and lightweight Next.js application  
- Powered by SQLite for simple and easy data management  

---

## Installation

1. **Install [Node.js](https://nodejs.org/)** (recommended v18 or later)

2. **Run Command Prompt as Administrator, and navigate to the directory where you want the application to be installed.**

3. **Create the application using this repository:**
```
npx create-next-app@latest clapperboard-app -e https://github.com/phani130999/clapperboard-release
```

4. **Navigate to the app folder:**
```
cd clapperboard-app
```

5. **Install dependencies:**
```
npm install
```

6. **Run the application:**
```
npm run dev
```

The Clapperboard app will be available at [http://localhost:3000](http://localhost:3000)

---

## Database

Clapperboard uses a local SQLite database (`clapperboard.db`) in the project root.

- To **reset** the database:
```
npm run reset
```

- To **seed** the database with dummy data:
```
npm run seed
```
---

## License

This project is licensed under the [GNU General Public License v3.0 or later](https://www.gnu.org/licenses/gpl-3.0.en.html).  
See the [LICENSE](LICENSE) file for details.

---

## Contact

**Phani Kondeti**  
📧 [phani.130999@gmail.com](mailto:phani.130999@gmail.com)  
🔗 [GitHub](https://github.com/phani130999)