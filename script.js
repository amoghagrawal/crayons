class ColorPalette {
    constructor() {
      this.colors = this.generateHarmonious();
      this.locked = Array(5).fill(false);
      this.savedPalettes = JSON.parse(localStorage.getItem('savedPalettes')) || [];
      this.colorNameCache = {};
      this.colorPromises = {};
      this.sidebarOpen = false;
      this.init();
    }
    init() {
      this.setupEventListeners();
      this.setupKeyboardControls();
      this.setupSidebarControls();
      this.generatePalette();
      this.renderSavedPalettes();
      this.setupMoodAnalysis();
    }
    setupEventListeners() {
      document.getElementById('save-btn').addEventListener('click', () => this.savePalette());
      document.getElementById('download-btn').addEventListener('click', () => this.downloadCurrentPalette());
      document.getElementById('start-app').addEventListener('click', () => {
        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
      });
      document.getElementById('sidebar-toggle').addEventListener('click', () => this.toggleSidebar());
      document.getElementById('close-sidebar').addEventListener('click', () => this.toggleSidebar());
      document.getElementById('logo-link').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('landing-page').style.display = 'block';
      });
    }
    setupKeyboardControls() {
      document.getElementById('palette-container').addEventListener('mouseenter', () => {
        window.addEventListener('keydown', this.handleKeyPress);
      });
      document.getElementById('palette-container').addEventListener('mouseleave', () => {
        window.removeEventListener('keydown', this.handleKeyPress);
      });
    }
    setupSidebarControls() {
      this.sidebarOpen = false;
    }
    setupMoodAnalysis() {
      document.getElementById('mood-btn').addEventListener('click', () => this.analyzeMood());
    }
    async analyzeMood() {
        if (this.savedPalettes.length === 0) {
            this.showMoodPopup("😊", "No Saved Palettes Yet!");
            return;
        }
        this.showMoodPopup("🤔", "Analyzing...");
        try {
            const palettesToAnalyze = this.savedPalettes.slice(0, 4);
            const allColorData = [];
            for (const palette of palettesToAnalyze) {
                const responses = await Promise.all(
                    palette.map(color =>
                        fetch(`https://www.thecolorapi.com/id?hex=${color.replace('#', '')}`)
                    )
                );
                const colorData = await Promise.all(responses.map(res => res.json()));
                allColorData.push(...colorData);
            }
            const mood = this.determineMoodFromPalette(allColorData);
            this.showMoodPopup(mood.emoji, mood.mood);
        } catch (error) {
            console.error("Error analyzing mood:", error);
            this.showMoodPopup("😅", "Couldn't Analyze Mood");
        }
    }
    determineMoodFromPalette(colorData) {
        const moodCounts = {
            "Peaceful & Serene": { count: 0, emoji: "🕊️" },
            "Bold & Dynamic": { count: 0, emoji: "🔥" },
            "Playful & Creative": { count: 0, emoji: "🎨" },
            "Elegant & Sophisticated": { count: 0, emoji: "😶‍🌫️" },
            "Natural & Organic": { count: 0, emoji: "🍏" },
            "Vibrant & Energetic": { count: 0, emoji: "⚡" },
            "Minimal & Modern": { count: 0, emoji: "🤖" },
            "Romantic & Dreamy": { count: 0, emoji: "💕" },
            "Urban & Edgy": { count: 0, emoji: "😎" },
            "Nostalgic & Vintage": { count: 0, emoji: "👀" },
            "Fresh & Crisp": { count: 0, emoji: "🥰" },
            "Cozy & Comforting": { count: 0, emoji: "☕" },
            "Mysterious & Dramatic": { count: 0, emoji: "🕶️" },
            "Tropical & Exotic": { count: 0, emoji: "🏝️" },
            "Corporate & Professional": { count: 0, emoji: "📝" }
        };
        colorData.forEach(data => {
            const { h, s, l } = data.hsl;
            if (h >= 90 && h <= 270 && s < 0.4 && l > 0.6) moodCounts["Peaceful & Serene"].count++;
            if (s > 0.7 && l > 0.6 && (h < 90 || h > 270)) moodCounts["Bold & Dynamic"].count++;
            if (s > 0.7 && l > 0.6 && h >= 90 && h <= 270) moodCounts["Playful & Creative"].count++;
            if (l < 0.4 && s < 0.4) moodCounts["Elegant & Sophisticated"].count++;
            if (h >= 90 && h <= 180 && s > 0.5 && l > 0.4) moodCounts["Natural & Organic"].count++;
            if (s > 0.8 && l > 0.6 && (h < 90 || h > 270)) moodCounts["Vibrant & Energetic"].count++;
            if (s < 0.4 && l > 0.6 && Math.abs(h - 180) < 30) moodCounts["Minimal & Modern"].count++;
            if (h >= 300 || h <= 60) moodCounts["Romantic & Dreamy"].count++;
            if (l < 0.4 && s > 0.5) moodCounts["Urban & Edgy"].count++;
            if (s < 0.5 && l < 0.5 && h >= 30 && h <= 60) moodCounts["Nostalgic & Vintage"].count++;
            if (s > 0.6 && l > 0.7 && h >= 150 && h <= 210) moodCounts["Fresh & Crisp"].count++;
            if (l < 0.6 && s < 0.5 && h >= 30 && h <= 60) moodCounts["Cozy & Comforting"].count++;
            if (l < 0.4 && s > 0.5) moodCounts["Mysterious & Dramatic"].count++;
            if (h > 150 && h < 210 && s > 0.6 && l > 0.6) moodCounts["Tropical & Exotic"].count++;
            if (h >= 200 && h <= 240 && s < 0.5) moodCounts["Corporate & Professional"].count++;
        });
        const dominantMood = Object.entries(moodCounts).reduce((max, [key, value]) =>
            value.count > max.count ? { mood: key, emoji: value.emoji, count: value.count } : max,
            { mood: "Balanced & Neutral", emoji: "⚖️", count: 0 }
        );
    
        return { mood: dominantMood.mood, emoji: dominantMood.emoji };
    }    
    showMoodPopup(emoji, mood) {
      const popup = document.getElementById('mood-popup');
      const overlay = document.getElementById('popup-overlay');
      const moodEmoji = document.getElementById('mood-emoji');
      const moodTitle = document.getElementById('mood-title');
      const paletteContainer = document.getElementById('palette-container');
      moodEmoji.textContent = emoji;
      moodTitle.textContent = mood;
      popup.style.display = 'block';
      overlay.style.display = 'block';
      const closeBtn = document.getElementById('close-popup');
      closeBtn.style.width = '40px';
      closeBtn.style.height = '40px';
      const closeImg = closeBtn.querySelector('img');
      closeImg.style.transform = 'scale(2)';
      const closePopup = () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
        closeBtn.removeEventListener('click', closePopup);
      };
      closeBtn.addEventListener('click', closePopup);
      overlay.addEventListener('click', closePopup);
    }
    toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      const paletteContainer = document.getElementById('palette-container');
      if (this.sidebarOpen) {
        sidebar.classList.remove('open');
        paletteContainer.classList.remove('sidebar-open');
      } else {
        sidebar.classList.add('open');
        paletteContainer.classList.add('sidebar-open');
      }
      this.sidebarOpen = !this.sidebarOpen;
    }
    handleKeyPress = e => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.generateNewColors();
      }
    };
    generateRandomColor() {
      const h = Math.floor(Math.random() * 360);
      const s = Math.floor(Math.random() * 30 + 70);
      const l = Math.floor(Math.random() * 30 + 35);
      return this.hslToHex(h, s, l);
    }
    generateHarmonious() {
      const schemes = [this.generateAnalogous, this.generateMonochromatic, this.generateTriadic, this.generateComplementary, this.generateSplitComplementary];
      const selectedScheme = schemes[Math.floor(Math.random() * schemes.length)];
      return selectedScheme.call(this);
    }
    generateNewColors() {
      const newColors = this.generateHarmonious();
      this.colors = this.colors.map((color, index) => this.locked[index] ? color : newColors[index]);
      this.colorPromises = {};
      this.generatePalette();
    }
    generateAnalogous() {
      const baseHue = Math.floor(Math.random() * 360);
      return Array(5).fill().map((_, i) => {
        const hue = (baseHue + i * 15) % 360;
        const sat = Math.floor(Math.random() * 10 + 80);
        const light = Math.floor(Math.random() * 20 + 45);
        return this.hslToHex(hue, sat, light);
      });
    }
    generateMonochromatic() {
      const baseHue = Math.floor(Math.random() * 360);
      return Array(5).fill().map((_, i) => {
        const sat = 85 - i * 3;
        const light = 40 + i * 12;
        return this.hslToHex(baseHue, sat, light);
      });
    }
    generateTriadic() {
      const baseHue = Math.floor(Math.random() * 360);
      const hues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
      return Array(5).fill().map((_, i) => {
        const hue = hues[i % 3];
        const sat = Math.floor(Math.random() * 10 + 80);
        const light = Math.floor(Math.random() * 20 + 45);
        return this.hslToHex(hue, sat, light);
      });
    }
    generateComplementary() {
      const baseHue = Math.floor(Math.random() * 360);
      const compHue = (baseHue + 180) % 360;
      return Array(5).fill().map((_, i) => {
        const hue = i < 3 ? baseHue : compHue;
        const sat = Math.floor(Math.random() * 10 + 80);
        const light = 45 + i * 12;
        return this.hslToHex(hue, sat, light);
      });
    }
    generateSplitComplementary() {
      const baseHue = Math.floor(Math.random() * 360);
      const hue1 = (baseHue + 150) % 360;
      const hue2 = (baseHue + 210) % 360;
      const hues = [baseHue, hue1, hue2];
      return Array(5).fill().map((_, i) => {
        const hue = hues[i % 3];
        const sat = Math.floor(Math.random() * 10 + 80);
        const light = Math.floor(Math.random() * 20 + 45);
        return this.hslToHex(hue, sat, light);
      });
    }
    hslToHex(h, s, l) {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    }
    getContrastColor(hexcolor) {
      const hex = hexcolor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#000000' : '#ffffff';
    }
    async getColorName(hex) {
      if (this.colorNameCache[hex]) {
        return this.colorNameCache[hex];
      }
      try {
        const response = await fetch(`https://www.thecolorapi.com/id?hex=${hex.replace('#', '')}`);
        const data = await response.json();
        const name = data.name.value;
        this.colorNameCache[hex] = name;
        return name;
      } catch (error) {
        console.error('Error fetching color name:', error);
        return this.getFallbackColorName(hex);
      }
    }
    async generatePalette() {
      const container = document.getElementById('palette-container');
      container.innerHTML = '';
      for (let index = 0; index < this.colors.length; index++) {
        const color = this.colors[index];
        const block = document.createElement('div');
        block.className = 'color-block';
        block.style.backgroundColor = color;
        const textColor = this.getContrastColor(color);
        block.addEventListener('click', () => this.copyToClipboard(color));
        const colorInfo = document.createElement('div');
        colorInfo.className = 'color-info';
        const hexCode = document.createElement('div');
        hexCode.className = 'hex-code';
        hexCode.textContent = color.toUpperCase();
        hexCode.style.color = textColor;
        hexCode.style.fontFamily = 'Aeonik';
        hexCode.style.fontWeight = 'bold';
        hexCode.style.fontSize = '1.4rem';
        const colorName = document.createElement('div');
        colorName.className = 'color-name';
        colorName.textContent = this.colorNameCache?.[color] || 'Loading...';
        colorName.style.color = textColor;
        colorName.style.fontFamily = 'Aeonik';
        colorName.style.fontWeight = 'normal';
        colorName.style.fontSize = '0.8rem';
        if (!this.colorNameCache[color]) {
          this.getColorName(color).then(name => {
            this.colorNameCache[color] = name;
            colorName.textContent = name;
          });
        }
        colorInfo.appendChild(hexCode);
        colorInfo.appendChild(colorName);
        block.appendChild(colorInfo);
        const lockBtn = document.createElement('button');
        lockBtn.className = 'lock-btn';
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");
        svg.setAttribute("fill", "white");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", this.locked[index] ? "M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z" : "M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h7V6a3 3 0 0 0-3-3 3 3 0 0 0-2.12.88 1 1 0 0 1-1.4 0c-.39-.39-.39-1.02 0-1.41a5 5 0 0 1 7.04 0A5 5 0 0 1 15 6v2h3z");
        svg.appendChild(path);
        lockBtn.appendChild(svg);
        lockBtn.addEventListener('click', e => {
          e.stopPropagation();
          this.toggleLock(index);
        });
        block.appendChild(lockBtn);
        container.appendChild(block);
      }
    }
    toggleLock(index) {
      this.locked[index] = !this.locked[index];
      const lockBtn = document.querySelectorAll('.lock-btn')[index];
      const path = lockBtn.querySelector('path');
      if (this.locked[index]) {
        path.setAttribute("d", "M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z");
      } else {
        path.setAttribute("d", "M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h7V6a3 3 0 0 0-3-3 3 3 0 0 0-2.12.88 1 1 0 0 1-1.4 0c-.39-.39-.39-1.02 0-1.41a5 5 0 0 1 7.04 0A5 5 0 0 1 15 6v2h3z");
      }
    }
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        toast.style.display = 'block';
        setTimeout(() => {
          toast.style.display = 'none';
        }, 2000);
      });
    }
    savePalette() {
      this.savedPalettes.unshift([...this.colors]);
      localStorage.setItem('savedPalettes', JSON.stringify(this.savedPalettes));
      this.renderSavedPalettes();
      const toast = document.getElementById('save-toast');
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 2000);
    }
    renderSavedPalettes() {
      const container = document.getElementById('saved-palettes-container');
      container.innerHTML = '';
      if (this.savedPalettes.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.textContent = 'No saved palettes yet';
        emptyState.style.textAlign = 'center';
        emptyState.style.color = 'var(--text-light)';
        container.appendChild(emptyState);
        return;
      }
      this.savedPalettes.forEach((palette, paletteIndex) => {
        const paletteElement = document.createElement('div');
        paletteElement.className = 'saved-palette';
        palette.forEach(color => {
          const colorElement = document.createElement('div');
          colorElement.className = 'saved-color';
          colorElement.style.backgroundColor = color;
          colorElement.addEventListener('click', () => this.copyToClipboard(color));
          paletteElement.appendChild(colorElement);
        });
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'palette-actions';
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.addEventListener('click', () => this.downloadPalette(palette));
        actionsContainer.appendChild(downloadBtn);
        paletteElement.appendChild(actionsContainer);
        container.appendChild(paletteElement);
      });
    }
    downloadPalette(palette) {
      const paletteData = palette.map(color => color.toUpperCase()).join(', ');
      const cssData = palette.map((color, i) => `--color-${i + 1}: ${color};`).join('\n');
      const scssData = palette.map((color, i) => `$color-${i + 1}: ${color};`).join('\n');
      const content = `Palette Colors:\n${paletteData}\n\nCSS Variables:\n${cssData}\n\nSCSS Variables:\n${scssData}`;
      const blob = new Blob([content], {
        type: 'text/plain'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'palette.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
    downloadCurrentPalette() {
      const paletteData = this.colors.map(color => color.toUpperCase()).join(', ');
      const cssData = this.colors.map((color, i) => `--color-${i + 1}: ${color};`).join('\n');
      const scssData = this.colors.map((color, i) => `$color-${i + 1}: ${color};`).join('\n');
      const content = `Palette Colors:\n${paletteData}\n\nCSS Variables:\n${cssData}\n\nSCSS Variables:\n${scssData}`;
      const blob = new Blob([content], {
        type: 'text/plain'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'palette.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
    getFallbackColorName(hex) {
      return "Unknown Color";
    }
    }
    new ColorPalette();