class Tamagotchi {
    constructor(name, type, energy = 50, fullness = 50, happiness = 50, id = null) {
        this.id = id || crypto.randomUUID();
        this.name = name;
        this.type = type;
        this.energy = energy;
        this.fullness = fullness;
        this.happiness = happiness;
    }

    nap() {
        this.energy += 40;
        this.happiness -= 10;
        this.fullness -= 10;
        this.maxMin();
    
        logActivity(`💤 You took a nap with ${this.name}.`);
        sounds.nap.play();
    }
    
    play() {
        this.energy -= 10;
        this.happiness += 30;
        this.fullness -= 10;
        this.maxMin();
    
        logActivity(`🎮 You played with ${this.name}.`);
        sounds.play.play();
    }
    
    eat() {
        this.energy -= 15;
        this.happiness += 5;
        this.fullness += 30;
        this.maxMin();
    
        logActivity(`🍽️ You fed ${this.name}.`);
        sounds.eat.play();
    }
    
    maxMin() {
        this.energy = Math.max(0, Math.min(100, this.energy));
        this.happiness = Math.max(0, Math.min(100, this.happiness));
        this.fullness = Math.max(0, Math.min(100, this.fullness));
    }
}

const tamagotchis = [];

const cooldowns = {};

const sounds = {
    nap: new Audio("/src/sounds/sleep.mp3"),
    play: new Audio("/src/sounds/play.mp3"),
    eat: new Audio("/src/sounds/eat.mp3"),
    death: new Audio("/src/sounds/death.mp3")
};

function loadTamagotchisFromStorage() {
    const stored = localStorage.getItem('tamagotchis');
    if (!stored) return;

    const parsed = JSON.parse(stored);
    parsed.forEach(t => {
        tamagotchis.push(new Tamagotchi(t.name, t.type, t.energy, t.fullness, t.happiness, t.id));
    });

    renderTamagotchis();
}

function startStatDecayLoop() {
    setInterval(() => {
        tamagotchis.forEach((t, index) => {
            t.energy = Math.max(0, t.energy - 15);
            t.fullness = Math.max(0, t.fullness - 15);
            t.happiness = Math.max(0, t.happiness - 15);

            if (t.energy <= 0 || t.fullness <= 0 || t.happiness <= 0) {
                logActivity(`⚠️ Oh no! ${t.name} ran away due to neglect. 💔`);
                sounds.death.play();

                setTimeout(() => {
                    tamagotchis.splice(index, 1);
                    saveTamagotchisToLocalStorage();
                    renderTamagotchis();
                    logActivity(`🪦 ${t.name} has been laid to rest.`);
                }, 3000);
            }
        });

        saveTamagotchisToLocalStorage();
        renderTamagotchis();
    }, 10000); 
}

function saveTamagotchisToLocalStorage() {
    localStorage.setItem('tamagotchis', JSON.stringify(tamagotchis));
}

function createTamagotchi() {
    if (tamagotchis.length >= 4) {
        alert('You can only have up to a maximum of 4 Tamagotchis.');
        return;
    }

    const name = document.getElementById('tamagotchi-name').value.trim();
    if (!name) {
        alert('Please enter a name for your Tamagotchi.');
        return;
    }
    const type = document.getElementById('tamagotchi-type').value;
    tamagotchis.push(new Tamagotchi(name, type));
    saveTamagotchisToLocalStorage();
    renderTamagotchis();
    closeModal();
}

function renderTamagotchis() {
    const consoleContainer = document.querySelector('.console-container');
    consoleContainer.innerHTML = tamagotchis.map(t => {
        const isDead = t.energy <= 0 || t.fullness <= 0 || t.happiness <= 0;
        const imageSrc = isDead ? "/src/img/rip.png" : `/src/img/${t.type}.png`;

        return `
            <div class="console">
                <h1>${t.name}</h1>
                <div class="screen">
                    <img src="${imageSrc}" alt="${t.type}" style="max-width: 100%; max-height: 100%; border-radius: 10px;">
                </div>
                <div class="controls">
                    <div class="control">
                        <button class="button red" onclick="updateProgress('${t.id}', 'energy')" ${isDead ? 'disabled' : ''}>Nap😴</button>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${t.energy}%; background: #eb3b5a;"></div>
                        </div>
                    </div>
                    <div class="control">
                        <button class="button gray" onclick="updateProgress('${t.id}', 'happiness')" ${isDead ? 'disabled' : ''}>Play⚽</button>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${t.happiness}%; background:rgb(194, 191, 165);"></div>
                        </div>
                    </div>
                    <div class="control">
                        <button class="button green" onclick="updateProgress('${t.id}', 'fullness')" ${isDead ? 'disabled' : ''}>Feed🍪</button>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${t.fullness}%; background: #20bf6b;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function isActionAvailable(tamagotchiId, actionType) {
    const now = Date.now();

    if (!cooldowns[tamagotchiId]) {
        cooldowns[tamagotchiId] = {
            energy: 0,
            happiness: 0,
            fullness: 0
        };
    }

    const nextAllowedTime = cooldowns[tamagotchiId][actionType];

    if (now < nextAllowedTime) {
        const timeLeftInSeconds = Math.ceil((nextAllowedTime - now) / 1000);
        const tamagotchi = tamagotchis.find(t => t.id === tamagotchiId);
        logActivity(`⏳ ${tamagotchi.name} needs to rest before doing that again! (${timeLeftInSeconds}s left)`);
        return false;
    }

    const cooldownDuration = 10000;
    cooldowns[tamagotchiId][actionType] = now + cooldownDuration;

    return true;
}

function updateProgress(tamagotchiId, actionType) {
    const t = tamagotchis.find(p => p.id === tamagotchiId);
    if (!t) return;

    if (!isActionAvailable(tamagotchiId, actionType)) return;

    switch (actionType) {
        case "energy":
            t.nap();
            break;
        case "happiness":
            t.play();
            break;
        case "fullness":
            t.eat();
            break;
        default:
            return;
    }

    const isDead = t.energy <= 0 || t.happiness <= 0 || t.fullness <= 0;
    if (isDead) {
        logActivity(`⚠️ Oh no! ${t.name} ran away due to neglect. 💔`);
        sounds.death.play();

        setTimeout(() => {
            const index = tamagotchis.findIndex(p => p.id === tamagotchiId);
            if (index !== -1) {
                tamagotchis.splice(index, 1);
                saveTamagotchisToLocalStorage();
                renderTamagotchis();
                logActivity(`🪦 ${t.name} has been laid to rest.`);
            }
        }, 3000);
    }

    saveTamagotchisToLocalStorage();
    renderTamagotchis();
}

function logActivity(text) {
    const logContainer = document.getElementById("activity-log");
    const newLog = document.createElement("p");
    newLog.textContent = text;
    logContainer.append(newLog);
    logContainer.scrollTop = logContainer.scrollHeight;
}



loadTamagotchisFromStorage();
startStatDecayLoop();

document.querySelector("[data-open-modal]").addEventListener("click", openModal);
document.querySelector(".cancel").addEventListener("click", closeModal);

function openModal() {
    if (tamagotchis.length >= 4) {
        alert('You can only create up to a maximum of 4 Tamagotchis.');
        return;
    }
    const modal = document.querySelector("[data-modal]");
    modal.showModal();
}

function closeModal() {
    const modal = document.querySelector("[data-modal]");
    modal.close();
}