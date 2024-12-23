class ColorPalette {
  constructor() {
    this.minColors = 1;
    this.maxColors = 8;
    this.colors = new Array(5).fill('#000000');
    this.locked = new Array(5).fill(false);
    this.savedPalettes = JSON.parse(localStorage.getItem('savedPalettes')) || [];
    this.colorNameCache = new Map();
    this.colorPromises = new Map();
    this.sidebarOpen = false;
    this.colors = this.generateHarmonious();
    window.colorPalette = this;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }
  init() {
    this.setupEventListeners();
    this.setupKeyboardControls();
    this.setupSidebarControls();
    this.generatePalette();
    this.renderSavedPalettes();
    this.setupMoodAnalysis();
    this.setupColorControls();
    this.setupColorBlindness();
    this.setupCaptureButton();
  }
  setupEventListeners() {
    const weakThis = new WeakRef(this);
    document.getElementById('save-btn')?.addEventListener('click', () => {
      const instance = weakThis.deref();
      if (instance) instance.savePalette();
    });
    document.getElementById('download-btn')?.addEventListener('click', () => {
      const instance = weakThis.deref();
      if (instance) instance.downloadCurrentPalette();
    });
    const startApp = document.getElementById('start-app');
    const landingPage = document.getElementById('landing-page');
    const appContainer = document.getElementById('app-container');
    startApp?.addEventListener('click', () => {
      landingPage.style.display = 'none';
      appContainer.style.display = 'block';
    });
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      const instance = weakThis.deref();
      if (instance) instance.toggleSidebar();
    });
    document.getElementById('close-sidebar')?.addEventListener('click', () => {
      const instance = weakThis.deref();
      if (instance) instance.toggleSidebar();
    });
    document.getElementById('logo-link')?.addEventListener('click', e => {
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
    document.getElementById('mood-btn')?.addEventListener('click', () => this.analyzeMood());
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
        const responses = await Promise.all(palette.map(color => fetch(`https://www.thecolorapi.com/id?hex=${color.replace('#', '')}`)));
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
      "Peaceful & Serene": {
        count: 0,
        emoji: "🕊️"
      },
      "Bold & Dynamic": {
        count: 0,
        emoji: "🔥"
      },
      "Playful & Creative": {
        count: 0,
        emoji: "🎨"
      },
      "Elegant & Sophisticated": {
        count: 0,
        emoji: "😶‍🌫️"
      },
      "Natural & Organic": {
        count: 0,
        emoji: "🍏"
      },
      "Vibrant & Energetic": {
        count: 0,
        emoji: "⚡"
      },
      "Minimal & Modern": {
        count: 0,
        emoji: "🤖"
      },
      "Romantic & Dreamy": {
        count: 0,
        emoji: "💕"
      },
      "Urban & Edgy": {
        count: 0,
        emoji: "😎"
      },
      "Nostalgic & Vintage": {
        count: 0,
        emoji: "👀"
      },
      "Fresh & Crisp": {
        count: 0,
        emoji: "🥰"
      },
      "Cozy & Comforting": {
        count: 0,
        emoji: "☕"
      },
      "Mysterious & Dramatic": {
        count: 0,
        emoji: "🕶️"
      },
      "Tropical & Exotic": {
        count: 0,
        emoji: "🏝️"
      },
      "Corporate & Professional": {
        count: 0,
        emoji: "📝"
      }
    };
    colorData.forEach(data => {
      const {
        h,
        s,
        l
      } = data.hsl;
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
    const dominantMood = Object.entries(moodCounts).reduce((max, [key, value]) => value.count > max.count ? {
      mood: key,
      emoji: value.emoji,
      count: value.count
    } : max, {
      mood: "Balanced & Neutral",
      emoji: "⚖️",
      count: 0
    });
    return {
      mood: dominantMood.mood,
      emoji: dominantMood.emoji
    };
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
    return selectedScheme.call(this, this.colors.length);
  }
  generateNewColors() {
    const newColors = this.generateHarmonious();
    this.colors = this.colors.map((color, index) => this.locked[index] ? color : newColors[index] || this.generateRandomColor());
    this.colorPromises = new Map();
    this.generatePalette();
    this.updateColorControlsState();
  }
  generateAnalogous(length) {
    const baseHue = Math.floor(Math.random() * 360);
    const colors = [];
    for (let i = 0; i < length; i++) {
      const hue = (baseHue + i * (30 / length)) % 360;
      const sat = Math.floor(Math.random() * 10 + 80);
      const light = Math.floor(Math.random() * 20 + 45);
      colors.push(this.hslToHex(hue, sat, light));
    }
    return colors;
  }
  generateTriadic(length) {
    const baseHue = Math.floor(Math.random() * 360);
    const colors = [];
    for (let i = 0; i < length; i++) {
      const section = Math.floor(i * 3 / length);
      const hue = (baseHue + section * 120) % 360;
      const sat = Math.floor(Math.random() * 10 + 80);
      const light = Math.floor(Math.random() * 20 + 45);
      colors.push(this.hslToHex(hue, sat, light));
    }
    return colors;
  }
  generateMonochromatic(length) {
    const baseHue = Math.floor(Math.random() * 360);
    const colors = [];
    for (let i = 0; i < length; i++) {
      const sat = 85 - i * 70 / length;
      const light = 40 + i * 40 / length;
      colors.push(this.hslToHex(baseHue, sat, light));
    }
    return colors;
  }
  generateComplementary(length) {
    const baseHue = Math.floor(Math.random() * 360);
    const compHue = (baseHue + 180) % 360;
    const colors = [];
    for (let i = 0; i < length; i++) {
      const hue = i < Math.ceil(length / 2) ? baseHue : compHue;
      const sat = Math.floor(Math.random() * 10 + 80);
      const light = 45 + i * 40 / length;
      colors.push(this.hslToHex(hue, sat, light));
    }
    return colors;
  }
  generateSplitComplementary(length) {
    const baseHue = Math.floor(Math.random() * 360);
    const hue1 = (baseHue + 150) % 360;
    const hue2 = (baseHue + 210) % 360;
    const colors = [];
    for (let i = 0; i < length; i++) {
      const section = Math.floor(i * 3 / length);
      const hue = section === 0 ? baseHue : section === 1 ? hue1 : hue2;
      const sat = Math.floor(Math.random() * 10 + 80);
      const light = 45 + i * 35 / length;
      colors.push(this.hslToHex(hue, sat, light));
    }
    return colors;
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
    if (this.colorNameCache.has(hex)) {
      return this.colorNameCache.get(hex);
    }
    if (!this.colorPromises.has(hex)) {
      this.colorPromises.set(hex, fetch(`https://www.thecolorapi.com/id?hex=${hex.replace('#', '')}`).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      }).then(data => {
        const name = data.name.value;
        this.colorNameCache.set(hex, name);
        this.colorPromises.delete(hex);
        return name;
      }).catch(error => {
        console.error('Error fetching color name:', error);
        this.colorPromises.delete(hex);
        return this.getFallbackColorName(hex);
      }));
    }
    return this.colorPromises.get(hex);
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
      const colorInfo = document.createElement('div');
      colorInfo.className = 'color-info';
      const hexCode = document.createElement('input');
      hexCode.className = 'hex-code';
      hexCode.value = color.toUpperCase();
      hexCode.style.color = textColor;
      hexCode.style.fontFamily = 'Aeonik';
      hexCode.style.fontWeight = 'bold';
      hexCode.style.fontSize = '1.4rem';
      hexCode.style.background = 'transparent';
      hexCode.style.border = 'none';
      hexCode.style.outline = 'none';
      hexCode.style.width = '120px';
      hexCode.style.cursor = 'text';
      hexCode.style.transition = 'all 0.2s ease';
      hexCode.addEventListener('input', e => {
        e.stopPropagation();
        let newValue = e.target.value;
        newValue = newValue.replace(/[^0-9A-Fa-f]/g, '');
        if (newValue.length > 6) {
          newValue = newValue.slice(0, 6);
        }
        if (!newValue.startsWith('#')) {
          e.target.value = '#' + newValue;
        }
        if (newValue.length === 6) {
          const fullHex = '#' + newValue;
          const validatedColor = this.validateHexCode(fullHex);
          const finalColor = typeof validatedColor === 'string' ? validatedColor : validatedColor ? fullHex : this.colors[index];
          this.colors[index] = finalColor;
          block.style.backgroundColor = finalColor;
          this.getColorName(finalColor).then(name => {
            this.colorNameCache.set(finalColor, name);
            colorName.textContent = name;
          });
          const newTextColor = this.getContrastColor(finalColor);
          hexCode.style.color = newTextColor;
          hexCode.classList.toggle('dark', newTextColor === '#000000');
          colorName.style.color = newTextColor;
        }
      });
      hexCode.addEventListener('blur', () => {
        let value = hexCode.value;
        if (value && !value.startsWith('#')) {
          value = '#' + value;
        }
        while (value.length < 7) {
          value += '0';
        }
        hexCode.value = value.toUpperCase();
      });
      hexCode.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          hexCode.blur();
        }
      });
      colorInfo.appendChild(hexCode);
      const colorName = document.createElement('div');
      colorName.className = 'color-name';
      colorName.textContent = this.colorNameCache?.get(color) || 'Loading...';
      colorName.style.color = textColor;
      colorName.style.fontFamily = 'Aeonik';
      colorName.style.fontWeight = 'normal';
      colorName.style.fontSize = '0.8rem';
      if (!this.colorNameCache.has(color)) {
        this.getColorName(color).then(name => {
          this.colorNameCache.set(color, name);
          colorName.textContent = name;
        });
      }
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
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      const copySvg = document.createElement('img');
      copySvg.setAttribute("src", "icons/CopyW.svg");
      copySvg.setAttribute("width", "24");
      copySvg.setAttribute("height", "24");
      copySvg.setAttribute("alt", "Copy");
      copyBtn.appendChild(copySvg);
      copyBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.copyToClipboard(color);
      });
      block.appendChild(copyBtn);
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
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      const toast = document.getElementById('toast');
      toast.style.display = 'block';
      toast.classList.remove('show');
      void toast.offsetWidth;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          toast.style.display = 'none';
        }, 300);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
  savePalette() {
    const maxSavedPalettes = 50;
    this.savedPalettes.unshift([...this.colors]);
    if (this.savedPalettes.length > maxSavedPalettes) {
      this.savedPalettes.length = maxSavedPalettes;
    }
    try {
      localStorage.setItem('savedPalettes', JSON.stringify(this.savedPalettes));
    } catch (err) {
      console.error('Failed to save palette:', err);
      this.savedPalettes.shift();
    }
    this.renderSavedPalettes();
    const toast = document.getElementById('save-toast');
    toast.style.display = 'block';
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.style.display = 'none';
      }, 300);
    }, 1500);
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
  setupColorControls() {
    const addBtn = document.getElementById('add-color');
    const removeBtn = document.getElementById('remove-color');
    addBtn.addEventListener('click', () => {
      if (this.colors.length < this.maxColors) {
        const newColor = this.generateRandomColor();
        this.colors.push(newColor);
        this.locked.push(false);
        this.generatePalette();
        this.updateColorControlsState();
      }
    });
    removeBtn.addEventListener('click', () => {
      if (this.colors.length > this.minColors) {
        this.colors.pop();
        this.locked.pop();
        this.generatePalette();
        this.updateColorControlsState();
      }
    });
    this.updateColorControlsState();
  }
  updateColorControlsState() {
    const addBtn = document.getElementById('add-color');
    const removeBtn = document.getElementById('remove-color');
    addBtn.disabled = this.colors.length >= this.maxColors;
    removeBtn.disabled = this.colors.length <= this.minColors;
    addBtn.style.opacity = addBtn.disabled ? '0.5' : '1';
    removeBtn.style.opacity = removeBtn.disabled ? '0.5' : '1';
  }
  setupColorBlindness() {
    const colorblindBtn = document.getElementById('colorblind-btn');
    const sidebar = document.getElementById('colorblind-sidebar');
    const closeBtn = document.getElementById('close-colorblind-sidebar');
    colorblindBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
    const visionTypes = document.querySelectorAll('.vision-type');
    visionTypes.forEach(button => {
      button.addEventListener('click', () => {
        visionTypes.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.applyColorBlindness(button.dataset.type);
      });
    });
  }
  applyColorBlindness(type) {
    const colorBlocks = document.querySelectorAll('.color-block');
    colorBlocks.forEach((block, index) => {
      const originalColor = this.colors[index];
      const simulatedColor = this.simulateColorBlindness(originalColor, type);
      block.style.backgroundColor = simulatedColor;
      const textElements = block.querySelectorAll('.hex-code, .color-name');
      const textColor = this.getContrastColor(simulatedColor);
      textElements.forEach(el => el.style.color = textColor);
    });
  }
  simulateColorBlindness(hexColor, type) {
    if (type === 'normal') return hexColor;
    const rgb = this.hexToRgb(hexColor);
    const matrices = {
      protanopia: [[0.567, 0.433, 0, 0], [0.558, 0.442, 0, 0], [0, 0.242, 0.758, 0]],
      deuteranopia: [[0.625, 0.375, 0, 0], [0.7, 0.3, 0, 0], [0, 0.3, 0.7, 0]],
      tritanopia: [[0.95, 0.05, 0, 0], [0, 0.433, 0.567, 0], [0, 0.475, 0.525, 0]],
      achromatopsia: [[0.299, 0.587, 0.114, 0], [0.299, 0.587, 0.114, 0], [0.299, 0.587, 0.114, 0]]
    };
    if (!matrices[type]) return hexColor;
    const matrix = matrices[type];
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const simR = (matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b) * 255;
    const simG = (matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b) * 255;
    const simB = (matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b) * 255;
    return this.rgbToHex(Math.round(simR), Math.round(simG), Math.round(simB));
  }
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  validateHexCode(hex) {
    const completeRegex = /^#[0-9A-Fa-f]{6}$/;
    if (completeRegex.test(hex)) {
      return true;
    }
    const partialRegex = /^#[0-9A-Fa-f]{1,5}$/;
    if (partialRegex.test(hex)) {
      const avgLuminance = this.colors.reduce((sum, color) => {
        const rgb = this.hexToRgb(color);
        return sum + (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      }, 0) / this.colors.length;
      return avgLuminance > 0.5 ? '#000000' : '#FFFFFF';
    }
    return false;
  }
  setupCaptureButton() {
    const captureBtn = document.getElementById('capture-btn');
    captureBtn.addEventListener('click', () => this.captureCurrentPalette());
    captureBtn.addEventListener('mouseover', () => {
      const cameraIcon = captureBtn.querySelector('.camera-icon');
      cameraIcon.style.opacity = '1';
      cameraIcon.style.transform = 'scale(1.1)';
    });
    captureBtn.addEventListener('mouseout', () => {
      const cameraIcon = captureBtn.querySelector('.camera-icon');
      cameraIcon.style.opacity = '0.8';
      cameraIcon.style.transform = 'scale(1)';
    });
  }
  async captureCurrentPalette() {
    const container = document.getElementById('palette-container');
    const clone = container.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = container.offsetWidth + 'px';
    clone.style.height = container.offsetHeight + 'px';
    document.body.appendChild(clone);
    try {
      const canvas = await html2canvas(clone, {
        backgroundColor: null,
        scale: 2,
        logging: false
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'color-palette.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error capturing palette:', error);
    } finally {
      document.body.removeChild(clone);
    }
  }
}
class TrendingPalettes {
  constructor() {
    this.trendingPalettes = [];
    this.page = 1;
    this.loading = false;
    this.init();
  }
  init() {
    this.setupEventListeners();
    this.generateInitialPalettes();
    this.setupInfiniteScroll();
  }
  setupEventListeners() {
    const viewTrendingBtn = document.getElementById('view-trending');
    const backBtn = document.querySelector('.back-to-generator');
    const trendingLogo = document.getElementById('trending-logo');
    if (viewTrendingBtn) {
      viewTrendingBtn.addEventListener('click', () => {
        this.showTrendingPage();
      });
    }
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.hideTrendingPage();
      });
    }
    if (trendingLogo) {
      trendingLogo.addEventListener('click', () => {
        document.getElementById('trending-page').style.display = 'none';
        document.getElementById('landing-page').style.display = 'block';
      });
    }
  }
  generatePalette() {
    const schemes = [this.generateAnalogous, this.generateMonochromatic, this.generateTriadic, this.generateComplementary, this.generateSplitComplementary];
    const selectedScheme = schemes[Math.floor(Math.random() * schemes.length)];
    return selectedScheme.call(this);
  }
  generateAnalogous() {
    const baseHue = Math.floor(Math.random() * 360);
    const colors = [];
    for (let i = 0; i < 5; i++) {
      const hue = (baseHue + i * 30) % 360;
      const sat = Math.floor(Math.random() * 20 + 65);
      const light = Math.floor(Math.random() * 30 + 35);
      colors.push(this.hslToHex(hue, sat, light));
    }
    return colors;
  }
  generateMonochromatic() {
    const baseHue = Math.floor(Math.random() * 360);
    const colors = [];
    const baseSat = Math.floor(Math.random() * 20 + 60);
    for (let i = 0; i < 5; i++) {
      const sat = Math.min(100, baseSat + i * 5);
      const light = 30 + i * 12;
      colors.push(this.hslToHex(baseHue, sat, light));
    }
    return colors;
  }
  generateTriadic() {
    const baseHue = Math.floor(Math.random() * 360);
    const colors = [];
    const hues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
    for (let i = 0; i < 5; i++) {
      const hueIndex = i % 3;
      const sat = Math.floor(Math.random() * 20 + 70);
      const light = Math.floor(Math.random() * 25 + 40);
      colors.push(this.hslToHex(hues[hueIndex], sat, light));
    }
    return colors;
  }
  generateComplementary() {
    const baseHue = Math.floor(Math.random() * 360);
    const compHue = (baseHue + 180) % 360;
    const colors = [];
    for (let i = 0; i < 5; i++) {
      const hue = i < 3 ? baseHue : compHue;
      const sat = Math.floor(Math.random() * 20 + 65);
      const light = 35 + i * 10;
      colors.push(this.hslToHex(hue, sat, light));
    }
    return colors;
  }
  generateSplitComplementary() {
    const baseHue = Math.floor(Math.random() * 360);
    const comp1 = (baseHue + 150) % 360;
    const comp2 = (baseHue + 210) % 360;
    const colors = [];
    const hues = [baseHue, comp1, comp2];
    for (let i = 0; i < 5; i++) {
      const hueIndex = i % 3;
      const sat = Math.floor(Math.random() * 15 + 70);
      const light = Math.floor(Math.random() * 25 + 35);
      colors.push(this.hslToHex(hues[hueIndex], sat, light));
    }
    return colors;
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
    const r = parseInt(hexcolor.substr(1, 2), 16);
    const g = parseInt(hexcolor.substr(3, 2), 16);
    const b = parseInt(hexcolor.substr(5, 2), 16);
    const yiq = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return yiq >= 0.5 ? '#000000' : '#ffffff';
  }
  async selectPalette(palette) {
    const paletteEl = document.createElement('div');
    paletteEl.className = 'trending-palette';
    const colorsEl = document.createElement('div');
    colorsEl.className = 'trending-colors';
    const colorPromises = palette.map(color => fetch(`https://www.thecolorapi.com/id?hex=${color.replace('#', '')}`).then(response => response.json()).then(data => data.name.value).catch(() => 'Color'));
    const colorNames = await Promise.all(colorPromises);
    palette.forEach((color, index) => {
      const colorBlock = document.createElement('div');
      colorBlock.style.flex = '1';
      colorBlock.style.display = 'flex';
      colorBlock.style.flexDirection = 'column';
      colorBlock.style.justifyContent = 'flex-end';
      colorBlock.style.alignItems = 'center';
      colorBlock.style.padding = '20px';
      colorBlock.style.backgroundColor = color;
      colorBlock.style.transition = 'none';
      colorBlock.style.transform = 'none';
      const colorInfo = document.createElement('div');
      colorInfo.style.background = 'rgba(255,255,255,0.95)';
      colorInfo.style.padding = '15px 20px';
      colorInfo.style.borderRadius = '8px';
      colorInfo.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      colorInfo.style.textAlign = 'center';
      const hexCode = document.createElement('div');
      hexCode.textContent = color.toUpperCase();
      hexCode.style.fontFamily = 'Aeonik, sans-serif';
      hexCode.style.fontSize = '1.2rem';
      hexCode.style.fontWeight = 'bold';
      hexCode.style.letterSpacing = '0.5px';
      hexCode.style.textShadow = '0 1px 1px rgba(0,0,0,0.1)';
      hexCode.style.color = '#000000';
      const colorName = document.createElement('div');
      colorName.textContent = colorNames[index];
      colorName.style.fontFamily = 'Aeonik, sans-serif';
      colorName.style.fontSize = '14px';
      colorName.style.color = '#666666';
      colorName.style.marginTop = '4px';
      colorInfo.appendChild(hexCode);
      colorInfo.appendChild(colorName);
      colorBlock.appendChild(colorInfo);
      colorsEl.appendChild(colorBlock);
    });
    paletteEl.appendChild(colorsEl);
    paletteEl.style.position = 'absolute';
    paletteEl.style.left = '-9999px';
    document.body.appendChild(paletteEl);
    html2canvas(paletteEl, {
      backgroundColor: null,
      scale: 2,
      logging: false
    }).then(canvas => {
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'color-palette.png';
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(paletteEl);
      }, 'image/png');
    });
  }
  generateInitialPalettes() {
    this.trendingPalettes = Array.from({
      length: 20
    }, () => this.generatePalette());
    this.renderPalettes();
  }
  renderPalettes() {
    const grid = document.getElementById('trending-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const header = document.querySelector('.trending-header');
    if (header) {
      if (!header.querySelector('.trending-subtitle')) {
        const subtitle = document.createElement('p');
        subtitle.className = 'trending-subtitle';
        subtitle.textContent = 'Discover the most popular color combinations';
        header.appendChild(subtitle);
      }
    }
    this.trendingPalettes.forEach(palette => {
      const paletteEl = document.createElement('div');
      paletteEl.className = 'trending-palette';
      const colorsEl = document.createElement('div');
      colorsEl.className = 'trending-colors';
      palette.forEach(color => {
        const colorEl = document.createElement('div');
        colorEl.className = 'trending-color';
        colorEl.style.backgroundColor = color;
        colorsEl.appendChild(colorEl);
        colorEl.addEventListener('mouseenter', () => {
          colorEl.style.flex = '1.15';
          const siblings = [...colorsEl.children];
          siblings.forEach(sibling => {
            if (sibling !== colorEl) {
              sibling.style.flex = '0.95';
            }
          });
        });
        colorEl.addEventListener('mouseleave', () => {
          colorEl.style.flex = '1';
          const siblings = [...colorsEl.children];
          siblings.forEach(sibling => {
            if (sibling !== colorEl) {
              sibling.style.flex = '1';
            }
          });
        });
      });
      const infoEl = document.createElement('div');
      infoEl.className = 'trending-info';
      const downloadEl = document.createElement('div');
      downloadEl.className = 'trending-download';
      downloadEl.innerHTML = `
            <img src="icons/Download.svg" alt="Download">
            <span>Download</span>
        `;
      infoEl.appendChild(downloadEl);
      paletteEl.appendChild(colorsEl);
      paletteEl.appendChild(infoEl);
      downloadEl.addEventListener('click', e => {
        e.stopPropagation();
        this.selectPalette(palette);
      });
      grid.appendChild(paletteEl);
    });
  }
  showTrendingPage() {
    const landingPage = document.getElementById('landing-page');
    const appContainer = document.getElementById('app-container');
    const trendingPage = document.getElementById('trending-page');
    if (landingPage) {
      landingPage.style.display = 'none';
    }
    if (appContainer) {
      appContainer.style.display = 'none';
    }
    if (trendingPage) {
      trendingPage.style.display = 'block';
      const navbar = document.querySelector('.navbar-trending');
      if (navbar) {
        navbar.style.display = 'flex';
      }
    }
  }
  hideTrendingPage() {
    const trendingPage = document.getElementById('trending-page');
    const landingPage = document.getElementById('landing-page');
    if (trendingPage) {
      trendingPage.style.display = 'none';
      const navbar = document.querySelector('.navbar-trending');
      if (navbar) {
        navbar.style.display = 'none';
      }
    }
    if (landingPage) {
      landingPage.style.display = 'block';
    }
  }
  setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
      if (this.loading) return;
      const {
        scrollTop,
        scrollHeight,
        clientHeight
      } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        this.loading = true;
        this.loadMorePalettes();
      }
    });
  }
  loadMorePalettes() {
    const newPalettes = Array.from({
      length: 10
    }, () => this.generatePalette());
    this.trendingPalettes = [...this.trendingPalettes, ...newPalettes];
    this.renderPalettes();
    this.loading = false;
  }
}
document.addEventListener('DOMContentLoaded', () => {
  new ColorPalette();
  new TrendingPalettes();
});