// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// DOM элементы
const minion = document.getElementById('minion');
const totalBananasSpan = document.getElementById('totalBananas');
const levelSpan = document.getElementById('level');
const energySpan = document.getElementById('energy');
const energyMaxSpan = document.getElementById('energyMax');
const expFill = document.getElementById('expFill');
const expText = document.getElementById('expText');
const clickPowerSpan = document.getElementById('clickPower');
const prestigeCountSpan = document.getElementById('prestigeCount');
const prestigeBonusSpan = document.getElementById('prestigeBonus');
const prestigeBtn = document.getElementById('prestigeBtn');

// Ключ для сохранения в localStorage
const SAVE_KEY = 'minion_clicker_save';

// Данные игры
let gameData = {
    bananas: 0,           // текущие бананы
    level: 1,
    experience: 0,
    energy: 100,
    energyMax: 100,
    clickPower: 1,        // базовая сила клика
    prestigeCount: 0,
    prestigeBonus: 1.0,   // множитель от перерождений
    upgrades: {
        click_power: 0,
        energy_max: 0
    }
};

// Функция сохранения
function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameData));
}

// Функция загрузки
function loadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameData = { ...gameData, ...data };
            // Восстанавливаем структуру апгрейдов
            if (!gameData.upgrades) {
                gameData.upgrades = { click_power: 0, energy_max: 0 };
            }
            // Проверяем корректность данных
            if (gameData.energy > gameData.energyMax) gameData.energy = gameData.energyMax;
            if (gameData.level < 1) gameData.level = 1;
        } catch(e) {
            console.error('Ошибка загрузки:', e);
        }
    }
}

// Функция получения полной силы клика
function getTotalClickPower() {
    const upgradeBonus = gameData.upgrades.click_power;
    const basePower = gameData.clickPower + upgradeBonus;
    return Math.floor(basePower * gameData.prestigeBonus);
}

// Функция получения опыта для уровня
function getExpNeeded(level) {
    return Math.floor(100 + (level - 1) * 15);
}

// Функция добавления опыта
function addExperience(amount) {
    gameData.experience += amount;
    let needed = getExpNeeded(gameData.level);
    
    while (gameData.experience >= needed) {
        gameData.experience -= needed;
        gameData.level++;
        
        // При повышении уровня восстанавливаем 30% энергии
        const recoverAmount = Math.floor(gameData.energyMax * 0.3);
        gameData.energy = Math.min(gameData.energyMax, gameData.energy + recoverAmount);
        
        needed = getExpNeeded(gameData.level);
    }
}

// Функция обновления UI
function updateUI() {
    totalBananasSpan.textContent = Math.floor(gameData.bananas).toLocaleString();
    levelSpan.textContent = gameData.level;
    energySpan.textContent = Math.floor(gameData.energy);
    energyMaxSpan.textContent = gameData.energyMax;
    
    const needed = getExpNeeded(gameData.level);
    const percent = (gameData.experience / needed) * 100;
    expFill.style.width = `${Math.min(100, percent)}%`;
    expText.textContent = `${Math.floor(gameData.experience)}/${needed}`;
    
    const totalPower = getTotalClickPower();
    clickPowerSpan.textContent = `💪 x${totalPower}`;
    
    prestigeCountSpan.textContent = gameData.prestigeCount;
    const bonusPercent = Math.floor((gameData.prestigeBonus - 1) * 100);
    prestigeBonusSpan.textContent = bonusPercent;
    
    // Обновляем отображение уровней улучшений
    document.getElementById('level_click_power').textContent = `Ур.${gameData.upgrades.click_power}`;
    document.getElementById('level_energy_max').textContent = `Ур.${gameData.upgrades.energy_max}`;
    
    // Обновляем стоимости
    updateUpgradeCosts();
}

// Функция обновления стоимостей улучшений
function updateUpgradeCosts() {
    const clickPowerCost = Math.floor(100 * Math.pow(1.5, gameData.upgrades.click_power));
    const energyMaxCost = Math.floor(100 * Math.pow(1.5, gameData.upgrades.energy_max));
    
    document.getElementById('cost_click_power').textContent = clickPowerCost;
    document.getElementById('cost_energy_max').textContent = energyMaxCost;
}

// Функция показа плавающего числа
function showFloatingNumber(text, x, y, color = '#ffd966') {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = 'floating-number';
    div.style.left = `${x - 20}px`;
    div.style.top = `${y - 40}px`;
    div.style.color = color;
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 600);
}

// Обработчик клика по миньону
function handleClick(event) {
    if (gameData.energy <= 0) {
        showFloatingNumber('❌ Нет энергии!', event.clientX, event.clientY, '#ff8888');
        return;
    }
    
    // Анимация
    minion.classList.add('minion-click');
    setTimeout(() => minion.classList.remove('minion-click'), 180);
    
    const clickValue = getTotalClickPower();
    
    // Тратим энергию
    gameData.energy--;
    
    // Добавляем бананы
    gameData.bananas += clickValue;
    
    // Добавляем опыт (70% от силы клика, минимум 1)
    const expGain = Math.max(1, Math.floor(clickValue * 0.7));
    addExperience(expGain);
    
    // Показываем число
    showFloatingNumber(`+${clickValue} 🍌`, event.clientX, event.clientY);
    
    // Проверка энергии
    if (gameData.energy < 0) gameData.energy = 0;
    
    updateUI();
    saveGame();
}

// Восстановление энергии
function startEnergyRegen() {
    setInterval(() => {
        if (gameData.energy < gameData.energyMax) {
            gameData.energy = Math.min(gameData.energyMax, gameData.energy + 1);
            updateUI();
            saveGame();
        }
    }, 1000);
}

// Покупка улучшения
function buyUpgrade(upgradeType) {
    let currentLevel = gameData.upgrades[upgradeType];
    let cost = Math.floor(100 * Math.pow(1.5, currentLevel));
    
    if (gameData.bananas >= cost) {
        gameData.bananas -= cost;
        gameData.upgrades[upgradeType]++;
        
        if (upgradeType === 'energy_max') {
            const oldMax = gameData.energyMax;
            gameData.energyMax = 100 + (gameData.upgrades.energy_max * 10);
            gameData.energy = Math.min(gameData.energyMax, gameData.energy + (gameData.energyMax - oldMax));
        }
        
        updateUI();
        saveGame();
        
        // Показываем уведомление
        const fakeEvent = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
        showFloatingNumber('✅ Улучшено!', fakeEvent.clientX, fakeEvent.clientY, '#a5ff9e');
    } else {
        const fakeEvent = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
        showFloatingNumber('❌ Не хватает бананов!', fakeEvent.clientX, fakeEvent.clientY, '#ffaa88');
    }
}

// Перерождение (престиж)
function performPrestige() {
    // Проверка условий
    if (gameData.level < 5) {
        showFloatingNumber('❌ Нужен 5 уровень!', window.innerWidth / 2, 200, '#ffaa88');
        return;
    }
    
    if (gameData.bananas < 1000) {
        showFloatingNumber('❌ Нужно 1000 бананов!', window.innerWidth / 2, 200, '#ffaa88');
        return;
    }
    
    // Расчёт нового бонуса (+15% за каждое перерождение, максимум +300%)
    const newPrestigeCount = gameData.prestigeCount + 1;
    let newBonus = 1.0 + (newPrestigeCount * 0.15);
    if (newBonus > 4.0) newBonus = 4.0;
    
    // Сохраняем бонус от перерождений для базы
    const baseBonus = Math.floor(newPrestigeCount * 0.5);
    
    // Сброс игры с сохранением бонусов
    gameData = {
        bananas: 0,
        level: 1,
        experience: 0,
        energy: 100,
        energyMax: 100,
        clickPower: 1 + baseBonus,
        prestigeCount: newPrestigeCount,
        prestigeBonus: newBonus,
        upgrades: {
            click_power: 0,
            energy_max: 0
        }
    };
    
    updateUI();
    saveGame();
    showFloatingNumber('✨ ПЕРЕРОЖДЕНИЕ! ✨', window.innerWidth / 2, 250, '#ffdd99');
    setTimeout(() => {
        showFloatingNumber(`+${Math.floor((newBonus - 1) * 100)}% бонус`, window.innerWidth / 2, 180, '#ffec80');
    }, 300);
}

// Обработка нажатий на улучшения
document.querySelectorAll('.upgrade-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const upgradeType = item.dataset.upgrade;
        buyUpgrade(upgradeType);
    });
});

// Обработка кнопки перерождения
prestigeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    performPrestige();
});

// Обработчик клика по миньону
minion.addEventListener('click', handleClick);

// Отправка данных в Telegram (для интеграции с ботом)
function sendToTelegram() {
    tg.sendData(JSON.stringify({
        action: 'update_stats',
        bananas: gameData.bananas,
        level: gameData.level,
        prestige: gameData.prestigeCount
    }));
}

// Отправляем данные каждые 30 секунд
setInterval(sendToTelegram, 30000);

// Инициализация игры
loadGame();
updateUI();
startEnergyRegen();

// Сохраняем при закрытии страницы
window.addEventListener('beforeunload', () => {
    saveGame();
    sendToTelegram();
});
