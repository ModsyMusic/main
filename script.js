class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.filteredPlaylist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        this.volume = 0.7;
        this.searchQuery = '';
        this.sortMode = 'default'; // 'default', 'title', 'artist', 'duration'
        
        // Звук клика
        this.clickSound = new Audio('sounds/click.wav');
        this.clickSound.volume = 0.3;
        
        this.initializeElements();
        this.attachEventListeners();
        this.setupFileUpload();
        this.loadPlaylistFromStorage();
        this.setupParallax();
        this.updateUI();
    }

    initializeElements() {
        // Основные элементы
        this.playerMain = document.getElementById('playerMain');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.trackList = document.getElementById('trackList');
        this.playerControls = document.getElementById('playerControls');
        this.addTrackSection = document.getElementById('addTrackSection');
        
        // Статистика загрузки
        this.uploadStats = document.getElementById('uploadStats');
        this.trackCountEl = this.uploadStats.querySelector('.track-count');
        this.totalDurationEl = this.uploadStats.querySelector('.total-duration');
        
        // Дополнительные элементы управления
        this.clearPlaylistBtn = document.getElementById('clearPlaylistBtn');
        this.importPlaylistBtn = document.getElementById('importPlaylistBtn');
        this.importInput = document.getElementById('importInput');
        
        // Поиск и сортировка
        this.searchBtn = document.getElementById('searchBtn');
        this.searchContainer = document.getElementById('searchContainer');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.sortBtn = document.getElementById('sortBtn');
        
        // Информация о треке
        this.albumImage = document.getElementById('albumImage');
        this.albumPlaceholder = document.getElementById('albumPlaceholder');
        this.trackTitle = document.getElementById('trackTitle');
        this.artistName = document.getElementById('artistName');
        
        // Прогресс бар
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.progress = document.getElementById('progress');
        this.progressHandle = document.getElementById('progressHandle');
        this.progressBar = document.querySelector('.progress-bar');
        
        // Элементы управления
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        
        // Контроль громкости
        this.volumeProgress = document.getElementById('volumeProgress');
        this.volumeHandle = document.getElementById('volumeHandle');
        this.volumeBar = document.querySelector('.volume-bar');
        this.volumePercent = document.getElementById('volumePercent');
        
        // Уведомления
        this.notifications = document.getElementById('notifications');
    }

    attachEventListeners() {
        // Кнопки управления
        this.playBtn.addEventListener('click', () => {
            this.playClickSound();
            this.togglePlay();
        });
        this.prevBtn.addEventListener('click', () => {
            this.playClickSound();
            this.previousTrack();
        });
        this.nextBtn.addEventListener('click', () => {
            this.playClickSound();
            this.nextTrack();
        });
        this.shuffleBtn.addEventListener('click', () => {
            this.playClickSound();
            this.toggleShuffle();
        });
        this.repeatBtn.addEventListener('click', () => {
            this.playClickSound();
            this.toggleRepeat();
        });
        
        // Дополнительные элементы управления
        this.clearPlaylistBtn.addEventListener('click', () => {
            this.playClickSound();
            this.clearPlaylist();
        });
        this.importPlaylistBtn.addEventListener('click', () => {
            this.playClickSound();
            this.importInput.click();
        });
        this.importInput.addEventListener('change', (e) => this.importPlaylist(e));
        
        // Поиск и сортировка
        this.searchBtn.addEventListener('click', () => {
            this.playClickSound();
            this.toggleSearch();
        });
        this.searchInput.addEventListener('input', (e) => this.searchTracks(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => {
            this.playClickSound();
            this.clearSearch();
        });
        this.sortBtn.addEventListener('click', () => {
            this.playClickSound();
            this.toggleSort();
        });
        
        // Прогресс бар
        this.progressBar.addEventListener('click', (e) => this.seekTo(e));
        this.progressHandle.addEventListener('mousedown', (e) => this.startDragging(e, 'progress'));
        
        // Контроль громкости
        this.volumeBar.addEventListener('click', (e) => this.setVolume(e));
        this.volumeHandle.addEventListener('mousedown', (e) => this.startDragging(e, 'volume'));
        
        // События аудио
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));
        
        
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    }

    setupFileUpload() {
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.addTracks(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        this.uploadArea.style.borderColor = '#4a9eff';
        this.uploadArea.style.background = 'rgba(74, 158, 255, 0.1)';
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        this.uploadArea.style.background = 'rgba(255, 255, 255, 0.05)';
    }

    handleDrop(event) {
        event.preventDefault();
        this.uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        this.uploadArea.style.background = 'rgba(255, 255, 255, 0.05)';
        
        const files = Array.from(event.dataTransfer.files).filter(file => 
            file.type.startsWith('audio/')
        );
        this.addTracks(files);
    }

    addTracks(files) {
        let addedCount = 0;
        
        files.forEach(file => {
            const track = {
                id: Date.now() + Math.random(),
                file: file,
                title: this.extractTitle(file.name),
                artist: 'Неизвестный исполнитель',
                duration: 0,
                url: URL.createObjectURL(file),
                dateAdded: new Date().toISOString()
            };
            
            this.playlist.push(track);
            addedCount++;
        });
        
        this.filteredPlaylist = [...this.playlist];
        this.updatePlaylist();
        this.updateUI();
        this.savePlaylistToStorage();
        this.updateStats();
        
        this.showNotification(`Добавлено ${addedCount} треков`, 'success');
        
        if (this.playlist.length > 0 && !this.audio.src) {
            this.loadTrack(0);
        }
    }

    playClickSound() {
        try {
            this.clickSound.currentTime = 0;
            this.clickSound.play().catch(() => {
                // Игнорируем ошибки автовоспроизведения
            });
        } catch (error) {
            // Игнорируем ошибки
        }
    }

    extractTitle(filename) {
        return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    }

    updatePlaylist() {
        this.trackList.innerHTML = '';
        
        if (this.filteredPlaylist.length === 0) {
            const message = this.searchQuery ? 'Треки не найдены' : 'Плейлист пуст. Загрузите аудио файлы.';
            this.trackList.innerHTML = `<p class="empty-playlist">${message}</p>`;
            return;
        }
        
        this.filteredPlaylist.forEach((track, index) => {
            const originalIndex = this.playlist.findIndex(t => t.id === track.id);
            const trackElement = document.createElement('div');
            trackElement.className = `track-item ${originalIndex === this.currentTrackIndex ? 'active' : ''}`;
            trackElement.innerHTML = `
                <div class="track-item-info">
                    <div class="track-item-title">${track.title}</div>
                    <div class="track-item-artist">${track.artist}</div>
                </div>
                <div class="track-item-duration">${this.formatTime(track.duration)}</div>
            `;
            
            trackElement.addEventListener('click', () => {
                this.playClickSound();
                this.loadTrack(originalIndex);
            });
            this.trackList.appendChild(trackElement);
        });
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        // Проверяем, есть ли URL для воспроизведения
        if (!track.url) {
            this.showNotification('Файл недоступен. Загрузите трек заново.', 'error');
            return;
        }
        
        this.audio.src = track.url;
        
        // Эффект печати для названия трека
        this.typeText(this.trackTitle, track.title);
        this.artistName.textContent = track.artist;
        
        // Обновляем активный трек в плейлисте
        document.querySelectorAll('.track-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        this.updateUI();
    }

    typeText(element, text) {
        element.textContent = '';
        element.classList.add('typing');
        
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
                setTimeout(() => {
                    element.classList.remove('typing');
                }, 1000);
            }
        }, 50);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.playlist.length === 0) return;
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.playerMain.classList.add('playing');
        }).catch(error => {
            console.error('Ошибка воспроизведения:', error);
        });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.playerMain.classList.remove('playing');
    }

    previousTrack() {
        if (this.playlist.length === 0) return;
        
        let newIndex = this.currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = this.playlist.length - 1;
        }
        
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    nextTrack() {
        if (this.playlist.length === 0) return;
        
        let newIndex = this.currentTrackIndex + 1;
        if (newIndex >= this.playlist.length) {
            newIndex = 0;
        }
        
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    handleTrackEnd() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 'all' || this.currentTrackIndex < this.playlist.length - 1) {
            this.nextTrack();
            if (this.isPlaying) {
                this.play();
            }
        } else {
            this.pause();
        }
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.classList.toggle('active', this.isShuffled);
        
        if (this.isShuffled) {
            this.shufflePlaylist();
        }
    }

    shufflePlaylist() {
        const currentTrack = this.playlist[this.currentTrackIndex];
        const otherTracks = this.playlist.filter((_, index) => index !== this.currentTrackIndex);
        
        // Перемешиваем остальные треки
        for (let i = otherTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
        }
        
        // Вставляем текущий трек в начало
        this.playlist = [currentTrack, ...otherTracks];
        this.currentTrackIndex = 0;
        this.updatePlaylist();
    }

    toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentModeIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
        
        this.repeatBtn.classList.toggle('active', this.repeatMode !== 'none');
        
        // Обновляем иконку
        const icons = ['fa-redo', 'fa-redo', 'fa-sync'];
        this.repeatBtn.innerHTML = `<i class="fas ${icons[currentModeIndex + 1]}"></i>`;
    }

    seekTo(event) {
        if (!this.audio.duration) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const newTime = percent * this.audio.duration;
        
        this.audio.currentTime = newTime;
        this.updateProgress();
    }

    setVolume(event) {
        const rect = this.volumeBar.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        this.volume = Math.max(0, Math.min(1, percent));
        
        this.audio.volume = this.volume;
        this.updateVolumeUI();
    }

    startDragging(event, type) {
        event.preventDefault();
        
        const handleMove = (e) => {
            if (type === 'progress') {
                const rect = this.progressBar.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                this.progress.style.width = percent * 100 + '%';
                this.progressHandle.style.left = percent * 100 + '%';
            } else if (type === 'volume') {
                const rect = this.volumeBar.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                this.volume = percent;
                this.audio.volume = this.volume;
                this.updateVolumeUI();
            }
        };
        
        const handleEnd = (e) => {
            if (type === 'progress') {
                const rect = this.progressBar.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                this.audio.currentTime = percent * this.audio.duration;
            }
            
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
        };
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }

    updateProgress() {
        if (!this.audio.duration) return;
        
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progress.style.width = percent + '%';
        this.progressHandle.style.left = percent + '%';
        
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        const track = this.playlist[this.currentTrackIndex];
        if (track) {
            track.duration = this.audio.duration;
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
            this.updatePlaylist();
        }
    }

    updateVolumeUI() {
        this.volumeProgress.style.width = this.volume * 100 + '%';
        this.volumeHandle.style.left = this.volume * 100 + '%';
        this.volumePercent.textContent = Math.round(this.volume * 100) + '%';
    }

    updateUI() {
        if (this.playlist.length > 0) {
            this.playerMain.style.display = 'flex';
            this.playerControls.style.display = 'block';
            this.uploadArea.style.display = 'none';
            this.addTrackSection.style.display = 'block';
        } else {
            this.playerMain.style.display = 'none';
            this.playerControls.style.display = 'none';
            this.uploadArea.style.display = 'block';
            this.addTrackSection.style.display = 'none';
        }
        
        this.updateVolumeUI();
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    handleAudioError(error) {
        console.error('Ошибка аудио:', error);
        this.showNotification('Ошибка воспроизведения трека', 'error');
    }

    // Дополнительные функции управления плейлистом
    clearPlaylist() {
        if (this.playlist.length === 0) return;
        
        if (confirm('Вы уверены, что хотите очистить плейлист?')) {
            this.playlist = [];
            this.filteredPlaylist = [];
            this.currentTrackIndex = 0;
            this.audio.src = '';
            this.pause();
            this.updatePlaylist();
            this.updateUI();
            this.savePlaylistToStorage();
            this.updateStats();
            this.showNotification('Плейлист очищен', 'success');
        }
    }


    importPlaylist(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.tracks && Array.isArray(data.tracks)) {
                    this.showNotification(`Импортировано ${data.tracks.length} треков (метаданные)`, 'success');
                } else {
                    this.showNotification('Неверный формат файла', 'error');
                }
            } catch (error) {
                this.showNotification('Ошибка чтения файла', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Поиск и сортировка
    toggleSearch() {
        const isVisible = this.searchContainer.style.display !== 'none';
        this.searchContainer.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            this.searchInput.focus();
        } else {
            this.clearSearch();
        }
    }

    searchTracks(query) {
        this.searchQuery = query.toLowerCase();
        this.filteredPlaylist = this.playlist.filter(track => 
            track.title.toLowerCase().includes(this.searchQuery) ||
            track.artist.toLowerCase().includes(this.searchQuery)
        );
        this.updatePlaylist();
    }

    clearSearch() {
        this.searchQuery = '';
        this.searchInput.value = '';
        this.filteredPlaylist = [...this.playlist];
        this.updatePlaylist();
    }

    toggleSort() {
        const modes = ['default', 'title', 'artist', 'duration'];
        const currentIndex = modes.indexOf(this.sortMode);
        this.sortMode = modes[(currentIndex + 1) % modes.length];
        
        this.sortPlaylist();
        this.updatePlaylist();
        
        const modeNames = ['По умолчанию', 'По названию', 'По исполнителю', 'По длительности'];
        this.showNotification(`Сортировка: ${modeNames[currentIndex + 1]}`, 'success');
    }

    sortPlaylist() {
        this.filteredPlaylist.sort((a, b) => {
            switch (this.sortMode) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'artist':
                    return a.artist.localeCompare(b.artist);
                case 'duration':
                    return b.duration - a.duration;
                default:
                    return 0;
            }
        });
    }

    // Сохранение и загрузка
    savePlaylistToStorage() {
        try {
            const playlistData = this.playlist.map(track => ({
                id: track.id,
                title: track.title,
                artist: track.artist,
                duration: track.duration,
                dateAdded: track.dateAdded,
                url: track.url // Сохраняем URL для воспроизведения
            }));
            localStorage.setItem('gtaMusicPlayer_playlist', JSON.stringify(playlistData));
        } catch (error) {
            console.error('Ошибка сохранения плейлиста:', error);
        }
    }

    loadPlaylistFromStorage() {
        try {
            const saved = localStorage.getItem('gtaMusicPlayer_playlist');
            if (saved) {
                const playlistData = JSON.parse(saved);
                // Восстанавливаем плейлист с URL для воспроизведения
                this.playlist = playlistData.map(track => ({
                    ...track,
                    file: null, // Файл не сохраняется, но URL остается
                    url: track.url || null
                }));
                
                // НЕ фильтруем треки - оставляем все, даже с недействительными URL
                this.filteredPlaylist = [...this.playlist];
                
                this.updatePlaylist();
                this.updateStats();
                this.updateUI();
                
                if (this.playlist.length > 0) {
                    this.showNotification('Плейлист восстановлен!', 'success');
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки плейлиста:', error);
        }
    }

    updateStats() {
        const totalDuration = this.playlist.reduce((sum, track) => sum + track.duration, 0);
        this.trackCountEl.textContent = `Треков: ${this.playlist.length}`;
        this.totalDurationEl.textContent = `Общее время: ${this.formatTime(totalDuration)}`;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.notifications.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupParallax() {
        // Интерактивный параллакс при движении мыши
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            // Получаем все слои параллакса
            const layers = document.querySelectorAll('.parallax-layer');
            
            layers.forEach((layer, index) => {
                const speed = (index + 1) * 0.5; // Разная скорость для каждого слоя
                const x = (mouseX - 0.5) * speed * 50;
                const y = (mouseY - 0.5) * speed * 50;
                
                // Применяем трансформацию
                layer.style.transform = `translate(${x}px, ${y}px)`;
            });
        });

        // Параллакс при скролле (если будет скролл)
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const layers = document.querySelectorAll('.parallax-layer');
            
            layers.forEach((layer, index) => {
                const speed = (index + 1) * 0.1;
                const yPos = -(scrolled * speed);
                layer.style.transform += ` translateY(${yPos}px)`;
            });
        });

        // Параллакс при наведении на плеер
        const musicPlayer = document.querySelector('.music-player');
        if (musicPlayer) {
            musicPlayer.addEventListener('mouseenter', () => {
                const layers = document.querySelectorAll('.parallax-layer');
                layers.forEach(layer => {
                    layer.style.transition = 'transform 0.3s ease';
                });
            });

            musicPlayer.addEventListener('mouseleave', () => {
                const layers = document.querySelectorAll('.parallax-layer');
                layers.forEach(layer => {
                    layer.style.transition = 'transform 0.3s ease';
                    layer.style.transform = '';
                });
            });
        }
    }

}

// Инициализация плеера при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});

// Добавляем поддержку клавиатуры
document.addEventListener('keydown', (e) => {
    const player = window.musicPlayer;
    if (!player) return;
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            player.togglePlay();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            player.previousTrack();
            break;
        case 'ArrowRight':
            e.preventDefault();
            player.nextTrack();
            break;
        case 'ArrowUp':
            e.preventDefault();
            player.volume = Math.min(1, player.volume + 0.1);
            player.audio.volume = player.volume;
            player.updateVolumeUI();
            break;
        case 'ArrowDown':
            e.preventDefault();
            player.volume = Math.max(0, player.volume - 0.1);
            player.audio.volume = player.volume;
            player.updateVolumeUI();
            break;
    }
});
