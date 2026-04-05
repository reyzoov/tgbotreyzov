Rezdravs:
// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// DOM элементы
const minion = document.getElementById('minion');
const totalClicksSpan = document.getElementById('totalClicks');
const levelSpan = document.getElementById('level');
const energySpan = document.getElementById('energy');
const energyMaxSpan = document.getElementById('energyMax');
const expFill = document.getElementById('expFill');
const expText = document.getElementById('expText');
const clickPowerSpan = document.getElementById('clickPower');
const prestigeCountSpan = document.getElementById('prestigeCount');
const prestigeBonusSpan = document.getElementById('prestigeBonus');

// Данные пользователя
let userData = {
    total_clicks: 0,
    level: 1,
    experience: 0,
    energy_current: 100,
    energy_max: 100,
    click_power: 1,
    prestige_count: 0,
    prestige_bonus: 1.0
};

let upgrades = {
    click_power: 0,
    energy_max: 0
};

// Функция загрузки данных
async function loadUserData() {
    // Отправляем запрос к боту
    tg.sendData(JSON.stringify({
        action: 'get_user_data'
    }));
}

// Функция обновления UI
function updateUI() {
    totalClicksSpan.textContent = userData.total_clicks.toLocaleString();
    levelSpan.textContent = userData.level;
    energySpan.textContent = userData.energy_current;
    energyMaxSpan.textContent = userData.energy_max;
    clickPowerSpan.textContent = 💪 x${userData.click_power};
    prestigeCountSpan.textContent = userData.prestige_count;
    prestigeBonusSpan.textContent = Math.floor((userData.prestige_bonus - 1) * 100);
    
    // Обновление опыта
    const expNeeded = userData.level * 100;
    const expPercent = (userData.experience / expNeeded) * 100;
    expFill.style.width = ${expPercent}%;
    expText.textContent = ${userData.experience}/${expNeeded};
    
    // Обновление стоимости апгрейдов
    updateUpgradeCosts();
}

// Функция обновления стоимости апгрейдов
function updateUpgradeCosts() {
    const clickPowerLevel = upgrades.click_power  0;
    const energyMaxLevel = upgrades.energy_max  0;
    
    const clickPowerCost = Math.floor(100 * Math.pow(1.5, clickPowerLevel));
    const energyMaxCost = Math.floor(100 * Math.pow(1.5, energyMaxLevel));
    
    document.getElementById('cost_click_power').textContent = clickPowerCost;
    document.getElementById('cost_energy_max').textContent = energyMaxCost;
    document.getElementById('level_click_power').textContent = Ур.${clickPowerLevel};
    document.getElementById('level_energy_max').textContent = Ур.${energyMaxLevel};
}

// Функция клика
function handleClick(event) {
    if (userData.energy_current <= 0) {
        showFloatingNumber('❌ Нет энергии!', event.clientX, event.clientY, '#ff6b6b');
        return;
    }
    
    // Анимация
    minion.classList.add('minion-click');
    setTimeout(() => minion.classList.remove('minion-click'), 200);
    
    // Показываем число
    const clickValue = userData.click_power * userData.prestige_bonus;
    showFloatingNumber(+${Math.floor(clickValue)}, event.clientX, event.clientY);
    
    // Отправляем клик в бота
    tg.sendData(JSON.stringify({
        action: 'click',
        click_power: userData.click_power,
        current_energy: userData.energy_current
    }));
    
    // Обновляем локально
    userData.energy_current--;
    userData.total_clicks += userData.click_power;
    
    updateUI();
}

// Функция показа плавающего числа
function showFloatingNumber(text, x, y, color = '#ffd966') {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = 'floating-number';
    div.style.left = ${x}px;
    div.style.top = ${y - 50}px;
    div.style.color = color;
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 500);
}

// Функция восстановления энергии
function startEnergyRegen() {
    setInterval(() => {
        if (userData.energy_current < userData.energy_max) {
            userData.energy_current = Math.min(userData.energy_max, userData.energy_current + 1);
            updateUI();
        }
    }, 1000);
}

// Обработка апгрейдов
document.querySelectorAll('.upgrade-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const upgradeType = item.dataset.upgrade;
        const currentLevel = upgrades[upgradeType] || 0;
        const cost = Math.floor(100 * Math.pow(1.5, currentLevel));
        
        if (userData.total_clicks >= cost) {
            // Отправляем запрос на покупку
            tg.sendData(JSON.stringify({
                action: 'upgrade',
                upgrade_type: upgradeType,
                cost: cost
            }));
        } else {
            showFloatingNumber('❌ Не хватает бананов!', e.clientX, e.clientY, '#ff6b6b');
        }
    });
});

// Обработка сообщений от бота
tg.onEvent('message', (message) => {
    try {
        const data = JSON.parse(message.data);
        
        if (data.user) {
            userData = {
                total_clicks: data.user.total_clicks,
                level: data.user.level,
                experience: data.user.experience,
                energy_current: data.user.energy_current,
                energy_max: data.user.energy_max,
                click_power: data.user.click_power,
                prestige_count: data.user.prestige_count,
                prestige_bonus: data.user.prestige_bonus
            };
            
            if (data.upgrades) {
                upgrades = data.upgrades;
            }
            
            updateUI();
        }
    } catch (e) {
        console.error('Ошибка парсинга:', e);
    }
});

// Инициализация
loadUserData();
startEnergyRegen();

// Обработчик клика
minion.addEventListener('click', handleClick);