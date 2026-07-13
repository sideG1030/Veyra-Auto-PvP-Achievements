// ==UserScript==
// @name         Veyra - Auto PvP For Achievements
// @namespace    https://github.com/sideG1030/
// @version      2.0.0
// @description  Automates Veyra PvP battles for achievements
// @author       sideG
// @match        *://*/pvp.php*
// @match        *://*/pvp_battle.php*
// @updateURL    https://raw.githubusercontent.com/sideG1030/Veyra-Auto-PvP-Achievements/main/veyra-auto-pvp-achievements.user.js
// @downloadURL  https://raw.githubusercontent.com/sideG1030/Veyra-Auto-PvP-Achievements/main/veyra-auto-pvp-achievements.user.js
// @homepageURL  https://github.com/sideG1030/Veyra-Auto-PvP-Achievements
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const PANEL_ID = 'sideg-pvp-control-panel';
    const STYLE_ID = 'sideg-pvp-panel-styles';

    const KEYS = {
        collapsed: 'sidegPvpPanelCollapsed',
        className: 'sidegPvpClass',
        specialization: 'sidegPvpSubclass',
        skillName: 'sidegPvpSkill',
        running: 'sidegPvpRunning',
        consecutive: 'sidegPvpConsecutiveBattles',
        usageLimit: 'sidegPvpUsageLimit',
        customPatternEnabled: 'sidegPvpCustomPatternEnabled',
        customPatternText: 'sidegPvpCustomPatternText',
        patternIndex: 'sidegPvpPatternIndex',
        tally: 'sidegPvpSkillTally'
    };

    const SUBCLASSES = {
        Mage: ['Grand Mage', 'Magic Knight'],
        Warrior: ['Paladin', 'Berserker'],
        Cleric: ['Saint', 'Inquisitor'],
        Hunter: ['Assassin', 'Archer']
    };

    const UNIVERSAL = [
        { name: 'Slash', skillId: '0' },
        { name: 'Power Slash', skillId: '-1' }
    ];

    const CLASS_SKILLS = {
        Mage: [
            { name: 'Fireball', skillId: '4' },
            { name: 'Arcane Sacrifice', skillId: '5' }
        ],
        Warrior: [
            { name: 'Ironclad Strike', skillId: '2' },
            { name: 'Warrior Aura', skillId: '3' },
            { name: 'Blood Pact', skillId: '19' },
            { name: 'Taunt', skillId: '20' }
        ],
        Cleric: [
            { name: 'Heal', skillId: '8' },
            { name: 'Judgement Seal', skillId: '9' },
            { name: 'Sanctified Breach', skillId: '18' }
        ],
        Hunter: [
            { name: 'Backstab', skillId: '6' },
            { name: 'Killer Instinct', skillId: '7' }
        ]
    };

    const ADVANCED_SKILLS = {
        Paladin: [
            { name: 'Radiant Guard', skillId: 'adv:1' },
            { name: 'Judgement Bash', skillId: 'adv:2' },
            { name: 'Aegis Intervention', skillId: 'adv:3' },
            { name: 'Sanctified Verdict', skillId: 'adv:4', requiresFullResource: true }
        ],
        Berserker: [
            { name: 'Skull Splitter', skillId: 'adv:6' },
            { name: 'Rampage Howl', skillId: 'adv:7' },
            { name: 'Ragnarock Heal', skillId: 'adv:8', requiresFullResource: true }
        ],
        'Grand Mage': [
            { name: 'Meteor Sigil', skillId: 'adv:9' },
            { name: 'Mana Collapse', skillId: 'adv:10' },
            { name: 'Elemental Dominion', skillId: 'adv:11' },
            { name: 'Astral Cataclysm', skillId: 'adv:12', requiresFullResource: true }
        ],
        'Magic Knight': [
            { name: 'Runebound Slash', skillId: 'adv:13' },
            { name: 'Spell Breaker Cut', skillId: 'adv:14' },
            { name: 'Mirror Aegis', skillId: 'adv:15' },
            { name: 'Eclipse Sever', skillId: 'adv:16', requiresFullResource: true }
        ],
        Assassin: [
            { name: 'Venom Rend', skillId: 'adv:18' },
            { name: 'Death Mark', skillId: 'adv:19' },
            { name: 'Final Wish', skillId: 'adv:20', requiresFullResource: true }
        ],
        Archer: [
            { name: 'Poison Bloom', skillId: 'adv:21' },
            { name: 'Deadeye Release', skillId: 'adv:22' },
            { name: 'Blacksky Volley', skillId: 'adv:23' },
            { name: 'Piercing Starshot', skillId: 'adv:24', requiresFullResource: true }
        ],
        Inquisitor: [
            { name: 'Brand of Guilt', skillId: 'adv:25' },
            { name: 'Purifying Flame', skillId: 'adv:26' },
            { name: 'Confession Breaker', skillId: 'adv:27' },
            { name: 'Final Sentence', skillId: 'adv:28', requiresFullResource: true }
        ],
        Saint: [
            { name: 'Blessed Recovery', skillId: 'adv:29' },
            { name: 'Divine Barrier', skillId: 'adv:30' },
            { name: 'Heaven Mercy', skillId: 'adv:32', requiresFullResource: true }
        ]
    };

    const SPECIALIZATION_TO_CLASS = Object.fromEntries(
        Object.entries(SUBCLASSES).flatMap(([className, specializations]) =>
            specializations.map(specialization => [specialization, className])
        )
    );

    const SKILLS_BY_SPECIALIZATION = Object.fromEntries(
        Object.keys(SPECIALIZATION_TO_CLASS).map(specialization => [
            specialization,
            [
                ...UNIVERSAL,
                ...(CLASS_SKILLS[SPECIALIZATION_TO_CLASS[specialization]] || []),
                ...(ADVANCED_SKILLS[specialization] || [])
            ]
        ])
    );

    const DELAYS = {
        battleCheck: 300,
        afterTarget: 150,
        afterSkill: 800,
        battleEnd: 1000,
        nextMatch: 1000,
        serverHourBuffer: 5000
    };

    let battleTimer = null;
    let tokenWaitTimer = null;
    let tokenCountdownTimer = null;
    let actionPending = false;
    let fastEnemyModePrepared = false;
    let restartPending = false;
    let matchmakingPending = false;
    let firstBattleAttackPending = true;

    let serverClockBaseEpoch = null;
    let serverClockBaseBrowserTime = null;
    let lastServerEpochAttribute = null;

    const ui = {};

    function getValue(key, fallback) {
        return GM_getValue(key, fallback);
    }

    function setValue(key, value) {
        GM_setValue(key, value);
    }

    function isPvPPage() {
        return location.pathname.endsWith('/pvp.php');
    }

    function isBattlePage() {
        return location.pathname.endsWith('/pvp_battle.php');
    }

    function isRunning() {
        return getValue(KEYS.running, false);
    }

    function setRunning(value) {
        setValue(KEYS.running, value);
        updateButtonState();
    }

    function isCustomPatternEnabled() {
        return getValue(KEYS.customPatternEnabled, false);
    }

    function getSelectedSpecialization() {
        return getValue(KEYS.specialization, 'Grand Mage');
    }

    function getSelectedSkillName() {
        return getValue(KEYS.skillName, 'Slash');
    }

    function getSkills(specialization = getSelectedSpecialization()) {
        return SKILLS_BY_SPECIALIZATION[specialization] || [];
    }

    function getSkillDefinition(skillName, specialization = getSelectedSpecialization()) {
        const normalized = String(skillName || '').trim().toLowerCase();
        return getSkills(specialization).find(
            skill => skill.name.toLowerCase() === normalized
        ) || null;
    }

    function setStatus(message, isError = false) {
        if (!ui.status) return;
        ui.status.textContent = message;
        ui.status.style.color = isError ? '#ff8a8a' : '#d6c08a';
    }

    function isButtonUsable(button) {
        return Boolean(
            button &&
            !button.disabled &&
            !button.hasAttribute('disabled') &&
            button.getAttribute('aria-disabled') !== 'true'
        );
    }

    function isElementVisible(element) {
        if (!element) return false;
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function parseUsageLimit(value) {
        const parsed = Number(String(value ?? '').trim());
        return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    }

    function getUsageLimit() {
        return parseUsageLimit(getValue(KEYS.usageLimit, ''));
    }

    function getTally() {
        const value = getValue(KEYS.tally, {});
        return value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : {};
    }

    function saveTally(tally) {
        setValue(KEYS.tally, tally);
        renderTally();
    }

    function resetTally() {
        saveTally({});
    }

    function incrementTally(skillName) {
        const tally = getTally();
        tally[skillName] = (Number(tally[skillName]) || 0) + 1;
        saveTally(tally);
    }

    function getCustomPatternValidation() {
        const specialization = ui.specialization?.value || getSelectedSpecialization();
        const text = ui.patternText?.value ?? getValue(KEYS.customPatternText, '');
        const lines = String(text)
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        const pattern = [];
        const unknown = [];

        for (const line of lines) {
            const definition = getSkillDefinition(line, specialization);
            if (definition) {
                pattern.push(definition.name);
            } else {
                unknown.push(line);
            }
        }

        return { pattern, unknown };
    }

    function getActivePattern() {
        return getCustomPatternValidation().pattern;
    }

    function getPatternTallyNames() {
        const names = [...new Set(getActivePattern())];
        const tally = getTally();

        if ((Number(tally.Slash) || 0) > 0 && !names.includes('Slash')) {
            names.push('Slash');
        }

        return names;
    }

    function getSingleModeTallyNames() {
        const selected = getSelectedSkillName();
        return selected === 'Slash' ? ['Slash'] : [selected, 'Slash'];
    }

    function renderTally() {
        if (!ui.tallyRows) return;

        const names = isCustomPatternEnabled()
            ? getPatternTallyNames()
            : getSingleModeTallyNames();

        const tally = getTally();
        ui.tallyRows.replaceChildren();

        for (const name of names) {
            const row = document.createElement('div');
            row.className = 'sideg-pvp-tally-row';

            const label = document.createElement('span');
            label.textContent = name;

            const value = document.createElement('strong');
            value.textContent = String(Number(tally[name]) || 0);

            row.append(label, value);
            ui.tallyRows.appendChild(row);
        }

        if (names.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'sideg-pvp-tally-empty';
            empty.textContent = 'Enter a valid attack pattern.';
            ui.tallyRows.appendChild(empty);
        }
    }

    function hasReachedUsageLimit() {
        if (isCustomPatternEnabled()) return false;

        const limit = getUsageLimit();
        if (limit <= 0) return false;

        const count = Number(getTally()[getSelectedSkillName()]) || 0;
        return count >= limit;
    }

    function validateCurrentConfiguration(showMessage = true) {
        if (isCustomPatternEnabled()) {
            const { pattern, unknown } = getCustomPatternValidation();

            if (pattern.length === 0) {
                if (showMessage) setStatus('Enter at least one valid skill in the custom pattern.', true);
                return false;
            }

            if (unknown.length > 0) {
                if (showMessage) {
                    setStatus(`Unknown skill${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}`, true);
                }
                return false;
            }

            return true;
        }

        const skill = getSkillDefinition(
            ui.skill?.value || getSelectedSkillName(),
            ui.specialization?.value || getSelectedSpecialization()
        );

        if (!skill) {
            if (showMessage) setStatus('Select a valid skill.', true);
            return false;
        }

        return true;
    }

    function updateButtonState() {
        if (ui.start) {
            ui.start.disabled = isRunning() || !validateCurrentConfiguration(false);
        }

        if (ui.stop) {
            ui.stop.disabled = !isRunning();
        }
    }

    function updateModeVisibility() {
        const custom = Boolean(ui.customPattern?.checked);

        if (ui.skillField) {
            ui.skillField.style.display = custom ? 'none' : 'block';
        }

        if (ui.patternField) {
            ui.patternField.style.display = custom ? 'block' : 'none';
        }

        if (ui.usageLimitField) {
            ui.usageLimitField.style.display = custom ? 'none' : 'block';
        }

        renderTally();
        updateButtonState();

        if (!isRunning()) {
            validateCurrentConfiguration(true);
            if (validateCurrentConfiguration(false)) setStatus('Ready');
        }
    }

    function getFindSoloMatchButton() {
        return document.querySelector(
            'button.action-btn.js-matchmake[data-ladder="solo"]'
        );
    }

    function findTokenValueInContainer(container) {
        if (!container) return null;

        for (const pill of container.querySelectorAll('.info-pill')) {
            const label = pill.querySelector('strong')?.textContent
                .trim()
                .replace(/:$/, '')
                .toLowerCase();

            if (label !== 'tokens') continue;

            const parsed = Number.parseInt(
                pill.querySelector('span')?.textContent.trim() || '',
                10
            );

            if (Number.isFinite(parsed)) return parsed;
        }

        return null;
    }

    function getSoloPvPTokens() {
        const matchButton = getFindSoloMatchButton();
        let container = matchButton?.parentElement || null;

        for (let depth = 0; container && depth < 8; depth += 1) {
            const value = findTokenValueInContainer(container);
            if (value !== null) return value;
            container = container.parentElement;
        }

        for (const pill of document.querySelectorAll('.info-pill')) {
            const label = pill.querySelector('strong')?.textContent
                .trim()
                .replace(/:$/, '')
                .toLowerCase();

            if (label !== 'tokens') continue;

            let ancestor = pill.parentElement;
            for (let depth = 0; ancestor && depth < 5; depth += 1) {
                if (
                    ancestor.textContent.toLowerCase().includes('solo ladder') ||
                    ancestor.querySelector('button.js-matchmake[data-ladder="solo"]')
                ) {
                    const parsed = Number.parseInt(
                        pill.querySelector('span')?.textContent.trim() || '',
                        10
                    );
                    return Number.isFinite(parsed) ? parsed : null;
                }
                ancestor = ancestor.parentElement;
            }
        }

        return null;
    }

    function refreshServerClockBase() {
        const element = document.getElementById('server_time');
        if (!element) return false;

        const attributeValue = element.dataset.epoch;
        const epoch = Number(attributeValue);
        if (!Number.isFinite(epoch)) return false;

        if (
            serverClockBaseEpoch === null ||
            attributeValue !== lastServerEpochAttribute
        ) {
            serverClockBaseEpoch = epoch;
            serverClockBaseBrowserTime = Date.now();
            lastServerEpochAttribute = attributeValue;
        }

        return true;
    }

    function getCurrentServerEpoch() {
        if (!refreshServerClockBase()) {
            return Math.floor(Date.now() / 1000);
        }

        return serverClockBaseEpoch + Math.floor(
            (Date.now() - serverClockBaseBrowserTime) / 1000
        );
    }

    function getNextServerHourEpoch() {
        const currentEpoch = getCurrentServerEpoch();
        const offset = Number(document.getElementById('server_time')?.dataset.tzoff) || 0;
        const localEpoch = currentEpoch + offset;
        return (Math.floor(localEpoch / 3600) + 1) * 3600 - offset;
    }

    function formatDuration(totalSeconds) {
        const seconds = Math.max(0, Math.ceil(totalSeconds));
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = seconds % 60;

        return hours > 0
            ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
            : `${minutes}:${String(remainder).padStart(2, '0')}`;
    }

    function clearTokenWaitTimers() {
        if (tokenWaitTimer !== null) {
            clearTimeout(tokenWaitTimer);
            tokenWaitTimer = null;
        }

        if (tokenCountdownTimer !== null) {
            clearInterval(tokenCountdownTimer);
            tokenCountdownTimer = null;
        }
    }

    function waitForNextServerHour() {
        clearTokenWaitTimers();
        matchmakingPending = false;

        const targetEpoch = getNextServerHourEpoch();

        const updateCountdown = () => {
            if (!isRunning()) {
                clearTokenWaitTimers();
                return;
            }

            setStatus(
                `No Solo PvP tokens. Next server hour in ${formatDuration(targetEpoch - getCurrentServerEpoch())}.`
            );
        };

        updateCountdown();
        tokenCountdownTimer = setInterval(updateCountdown, 1000);

        const delay = Math.max(
            1000,
            (targetEpoch - getCurrentServerEpoch()) * 1000 + DELAYS.serverHourBuffer
        );

        tokenWaitTimer = setTimeout(() => {
            clearTokenWaitTimers();
            if (isRunning()) location.reload();
        }, delay);
    }

    function beginMatchmaking() {
        if (matchmakingPending || !isRunning()) return;

        clearTokenWaitTimers();

        const tokens = getSoloPvPTokens();

        if (tokens === null) {
            setStatus('Waiting for the Solo PvP token count...');
            setTimeout(beginMatchmaking, 500);
            return;
        }

        if (tokens <= 0) {
            waitForNextServerHour();
            return;
        }

        const button = getFindSoloMatchButton();

        if (!isButtonUsable(button)) {
            setStatus('Find Solo Match is currently unavailable.');
            setTimeout(beginMatchmaking, 1000);
            return;
        }

        matchmakingPending = true;
        setStatus(`Starting solo matchmaking. Tokens remaining: ${tokens}.`);
        button.click();
    }

    function getElementText(id) {
        return document.getElementById(id)?.textContent.trim().toLowerCase() || '';
    }

    function getLatestBattleLogText() {
        const lines = document.querySelectorAll('.logLine .logText');
        return lines.length
            ? lines[lines.length - 1].textContent.trim().toLowerCase()
            : '';
    }

    function isBattleOver() {
        const status = getElementText('matchStatusBadge');
        const note = getElementText('noteText');
        const log = getLatestBattleLogText();

        const finishedStatus = [
            'victory', 'defeat', 'draw', 'won', 'lost', 'finished', 'complete'
        ].some(word => status.includes(word));

        const finishedText = [
            'won this season match', 'wins the room', 'victory',
            'defeat', 'battle ended', 'match ended'
        ].some(phrase => note.includes(phrase) || log.includes(phrase));

        const rewards = document.getElementById('rewardsModal');

        return finishedStatus ||
            finishedText ||
            Boolean(rewards?.classList.contains('show'));
    }

    function getBackToPvPButton() {
        return [...document.querySelectorAll('a.back-btn')].find(link => {
            const href = link.getAttribute('href') || '';
            return href === 'pvp.php' || href.endsWith('/pvp.php');
        }) || null;
    }

    function handleBattleFinished() {
        if (restartPending) return;

        restartPending = true;
        actionPending = false;
        clearBattleTimer();

        if (hasReachedUsageLimit()) {
            const selected = getSelectedSkillName();
            const count = Number(getTally()[selected]) || 0;
            stopAutomation(`${selected} used ${count} times. Limit reached.`);
            return;
        }

        if (!getValue(KEYS.consecutive, false)) {
            stopAutomation('Battle finished.');
            return;
        }

        setStatus('Battle finished. Returning to the PvP page...');

        setTimeout(() => {
            if (!isRunning()) return;

            const back = getBackToPvPButton();
            if (back) back.click();
            else location.href = 'pvp.php';
        }, DELAYS.battleEnd);
    }

    function prepareFastEnemyMode() {
        if (fastEnemyModePrepared) return true;

        const button = document.getElementById('fastEnemyBtn');
        if (!button) return false;

        if (button.classList.contains('active')) {
            fastEnemyModePrepared = true;
            return true;
        }

        if (!isButtonUsable(button)) return false;

        button.click();
        fastEnemyModePrepared = true;
        return true;
    }

    function ensureEnemyTargetSelected() {
        if (document.querySelector('#enemyFormation .pSlot.targeted')) {
            return { ready: true, newlySelected: false };
        }

        const target = [...document.querySelectorAll('#enemyFormation .pSlot')]
            .find(element => {
                const alive = element.dataset.alive === '1' ||
                    !element.classList.contains('dead');
                return alive && isElementVisible(element);
            });

        if (!target) return { ready: false, newlySelected: false };

        target.click();
        return { ready: true, newlySelected: true };
    }

    function getSkillButtonById(skillId) {
        return [...document.querySelectorAll('#skillsGrid button.skillCard')]
            .find(button => button.dataset.skillId === String(skillId)) || null;
    }

    function getSkillButtonByName(skillName) {
        return [...document.querySelectorAll('#skillsGrid button.skillCard')]
            .find(button =>
                button.querySelector('.skillName')?.textContent.trim() === skillName
            ) || null;
    }

    function getSkillButton(skillName) {
        const definition = getSkillDefinition(skillName);
        if (!definition) return null;

        return getSkillButtonById(definition.skillId) ||
            getSkillButtonByName(definition.name);
    }

    function selectedSkillRequiresFullResource() {
        const definition = getSkillDefinition(getSelectedSkillName());
        if (definition?.requiresFullResource) return true;

        return getSkillButton(getSelectedSkillName())
            ?.dataset.requiresFullResource === '1';
    }

    function chooseSingleModeSkill() {
        const selected = getSelectedSkillName();

        if (firstBattleAttackPending && selectedSkillRequiresFullResource()) {
            const powerSlash = getSkillButton('Power Slash');
            if (!isButtonUsable(powerSlash)) return null;

            return {
                button: powerSlash,
                skillName: 'Power Slash',
                openingPowerSlash: true,
                fallback: false
            };
        }

        const selectedButton = getSkillButton(selected);
        if (isButtonUsable(selectedButton)) {
            return {
                button: selectedButton,
                skillName: selected,
                openingPowerSlash: false,
                fallback: false
            };
        }

        const slash = getSkillButton('Slash');
        return isButtonUsable(slash)
            ? {
                button: slash,
                skillName: 'Slash',
                openingPowerSlash: false,
                fallback: true
            }
            : null;
    }

    function choosePatternSkill() {
        const pattern = getActivePattern();
        if (pattern.length === 0) return null;

        const storedIndex = Number(getValue(KEYS.patternIndex, 0)) || 0;
        const index = ((storedIndex % pattern.length) + pattern.length) % pattern.length;
        const requestedSkill = pattern[index];

        // Advance after every attempted pattern step, including Slash fallback.
        setValue(KEYS.patternIndex, (index + 1) % pattern.length);

        const requestedButton = getSkillButton(requestedSkill);
        if (isButtonUsable(requestedButton)) {
            return {
                button: requestedButton,
                skillName: requestedSkill,
                requestedSkill,
                fallback: false
            };
        }

        const slash = getSkillButton('Slash');
        return isButtonUsable(slash)
            ? {
                button: slash,
                skillName: 'Slash',
                requestedSkill,
                fallback: true
            }
            : null;
    }

    function chooseSkill() {
        return isCustomPatternEnabled()
            ? choosePatternSkill()
            : chooseSingleModeSkill();
    }

    function clearBattleTimer() {
        if (battleTimer !== null) {
            clearTimeout(battleTimer);
            battleTimer = null;
        }
    }

    function scheduleBattleCheck(delay = DELAYS.battleCheck) {
        clearBattleTimer();
        if (!isRunning()) return;

        battleTimer = setTimeout(() => {
            battleTimer = null;
            runBattleAutomation();
        }, delay);
    }

    function stopAutomation(message = 'Automation paused.', isError = false) {
        setRunning(false);
        actionPending = false;
        fastEnemyModePrepared = false;
        restartPending = false;
        matchmakingPending = false;
        firstBattleAttackPending = true;
        clearBattleTimer();
        clearTokenWaitTimers();
        setStatus(message, isError);
    }

    function clickNextSkill() {
        if (!isRunning()) {
            actionPending = false;
            return;
        }

        if (isBattleOver()) {
            handleBattleFinished();
            return;
        }

        const choice = chooseSkill();

        if (!choice) {
            actionPending = false;
            scheduleBattleCheck();
            return;
        }

        choice.button.click();
        firstBattleAttackPending = false;
        incrementTally(choice.skillName);

        if (choice.openingPowerSlash) {
            setStatus('Used Power Slash as the opening attack.');
        } else if (choice.fallback && isCustomPatternEnabled()) {
            setStatus(`${choice.requestedSkill} was unavailable. Used Slash.`);
        } else if (choice.fallback) {
            setStatus(`${getSelectedSkillName()} was unavailable. Used Slash.`);
        } else {
            setStatus(`Used ${choice.skillName}.`);
        }

        setTimeout(() => {
            actionPending = false;
            if (isRunning()) scheduleBattleCheck();
        }, DELAYS.afterSkill);
    }

    function runBattleAutomation() {
        if (!isRunning() || !isBattlePage()) {
            clearBattleTimer();
            return;
        }

        if (isBattleOver()) {
            handleBattleFinished();
            return;
        }

        if (!prepareFastEnemyMode() || actionPending) {
            scheduleBattleCheck();
            return;
        }

        if (!document.querySelector('#skillsGrid button.skillCard')) {
            scheduleBattleCheck();
            return;
        }

        const target = ensureEnemyTargetSelected();
        if (!target.ready) {
            scheduleBattleCheck();
            return;
        }

        actionPending = true;

        if (target.newlySelected) {
            setTimeout(clickNextSkill, DELAYS.afterTarget);
        } else {
            clickNextSkill();
        }
    }

    function createField(labelText, control) {
        const wrapper = document.createElement('div');
        wrapper.className = 'sideg-pvp-field';

        if (labelText) {
            const label = document.createElement('label');
            label.className = 'sideg-pvp-label';
            label.htmlFor = control.id;
            label.textContent = labelText;
            wrapper.appendChild(label);
        }

        wrapper.appendChild(control);
        return wrapper;
    }

    function createSelect(id) {
        const select = document.createElement('select');
        select.id = id;
        select.className = 'sideg-pvp-select';
        return select;
    }

    function setOptions(select, values, selectedValue = '') {
        select.replaceChildren();

        for (const value of values) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        }

        select.value = values.includes(selectedValue)
            ? selectedValue
            : values[0] || '';
    }

    function createCheckbox(labelText, id) {
        const wrapper = document.createElement('label');
        wrapper.className = 'sideg-pvp-checkbox-field';

        const checkbox = document.createElement('input');
        checkbox.id = id;
        checkbox.type = 'checkbox';
        checkbox.className = 'sideg-pvp-checkbox';

        const text = document.createElement('span');
        text.textContent = labelText;

        wrapper.append(checkbox, text);
        return { wrapper, checkbox };
    }

    function createPanel() {
        if (document.getElementById(PANEL_ID)) return;

        const panel = document.createElement('div');
        panel.id = PANEL_ID;

        const header = document.createElement('div');
        header.className = 'sideg-pvp-panel-header';

        const title = document.createElement('div');
        title.className = 'sideg-pvp-panel-title';
        title.textContent = 'Auto PvP';

        const collapse = document.createElement('button');
        collapse.className = 'sideg-pvp-collapse-button';
        collapse.type = 'button';

        header.append(title, collapse);

        const content = document.createElement('div');
        content.className = 'sideg-pvp-panel-content';

        ui.className = createSelect('sideg-pvp-class');
        ui.specialization = createSelect('sideg-pvp-specialization');
        ui.customPattern = createCheckbox(
            'Use custom attack pattern',
            'sideg-pvp-custom-pattern'
        ).checkbox;
        const customPatternWrapper = ui.customPattern.closest('label');

        ui.skill = createSelect('sideg-pvp-skill');

        ui.patternText = document.createElement('textarea');
        ui.patternText.id = 'sideg-pvp-pattern-text';
        ui.patternText.className = 'sideg-pvp-pattern-text';
        ui.patternText.placeholder = [
            'Power Slash',
            'Slash',
            'Slash',
            'Arcane Sacrifice',
            'Astral Cataclysm'
        ].join('\n');

        ui.usageLimit = document.createElement('input');
        ui.usageLimit.id = 'sideg-pvp-usage-limit';
        ui.usageLimit.type = 'text';
        ui.usageLimit.inputMode = 'numeric';
        ui.usageLimit.className = 'sideg-pvp-text-input';
        ui.usageLimit.placeholder = 'Input 0 to ignore the count.';

        const tally = document.createElement('div');
        tally.className = 'sideg-pvp-tally-section';

        const tallyTitle = document.createElement('div');
        tallyTitle.className = 'sideg-pvp-tally-heading';
        tallyTitle.textContent = 'Skill tally';

        ui.tallyRows = document.createElement('div');
        tally.append(tallyTitle, ui.tallyRows);

        const consecutive = createCheckbox(
            'Consecutive battles',
            'sideg-pvp-consecutive'
        );
        ui.consecutive = consecutive.checkbox;

        ui.start = document.createElement('button');
        ui.start.className = 'sideg-pvp-start-button';
        ui.start.type = 'button';
        ui.start.textContent = 'Start PvP';

        ui.stop = document.createElement('button');
        ui.stop.className = 'sideg-pvp-stop-button';
        ui.stop.type = 'button';
        ui.stop.textContent = 'Stop PvP';

        ui.status = document.createElement('div');
        ui.status.className = 'sideg-pvp-status';

        const classField = createField('Class', ui.className);
        const specializationField = createField('Specialization', ui.specialization);
        ui.skillField = createField('Skill', ui.skill);
        ui.patternField = createField(
            'Attack pattern (one skill per line)',
            ui.patternText
        );
        ui.usageLimitField = createField(
            'Selected skill usage target',
            ui.usageLimit
        );

        content.append(
            classField,
            specializationField,
            customPatternWrapper,
            ui.skillField,
            ui.patternField,
            ui.usageLimitField,
            tally,
            consecutive.wrapper,
            ui.start,
            ui.stop,
            ui.status
        );

        panel.append(header, content);
        document.body.appendChild(panel);

        const savedClass = getValue(KEYS.className, 'Mage');
        setOptions(ui.className, Object.keys(SUBCLASSES), savedClass);

        const savedSpecialization = getValue(KEYS.specialization, 'Grand Mage');
        setOptions(
            ui.specialization,
            SUBCLASSES[ui.className.value] || [],
            savedSpecialization
        );

        const savedSkill = getValue(KEYS.skillName, 'Slash');
        setOptions(
            ui.skill,
            getSkills(ui.specialization.value).map(skill => skill.name),
            savedSkill
        );

        ui.customPattern.checked = getValue(KEYS.customPatternEnabled, false);
        ui.patternText.value = getValue(KEYS.customPatternText, '');
        ui.usageLimit.value = String(getValue(KEYS.usageLimit, '') ?? '');
        ui.consecutive.checked = getValue(KEYS.consecutive, false);

        function setCollapsed(collapsed) {
            panel.classList.toggle('sideg-pvp-collapsed', collapsed);
            collapse.textContent = collapsed ? '+' : '−';
            setValue(KEYS.collapsed, collapsed);
        }

        setCollapsed(getValue(KEYS.collapsed, false));

        collapse.addEventListener('click', () => {
            setCollapsed(!panel.classList.contains('sideg-pvp-collapsed'));
        });

        ui.className.addEventListener('change', () => {
            setValue(KEYS.className, ui.className.value);
            setOptions(
                ui.specialization,
                SUBCLASSES[ui.className.value] || []
            );
            setValue(KEYS.specialization, ui.specialization.value);
            setOptions(
                ui.skill,
                getSkills(ui.specialization.value).map(skill => skill.name)
            );
            setValue(KEYS.skillName, ui.skill.value);
            setValue(KEYS.patternIndex, 0);
            resetTally();
            updateModeVisibility();
        });

        ui.specialization.addEventListener('change', () => {
            setValue(KEYS.specialization, ui.specialization.value);
            setOptions(
                ui.skill,
                getSkills(ui.specialization.value).map(skill => skill.name)
            );
            setValue(KEYS.skillName, ui.skill.value);
            setValue(KEYS.patternIndex, 0);
            resetTally();
            updateModeVisibility();
        });

        ui.skill.addEventListener('change', () => {
            setValue(KEYS.skillName, ui.skill.value);
            resetTally();
            updateModeVisibility();
        });

        ui.customPattern.addEventListener('change', () => {
            setValue(KEYS.customPatternEnabled, ui.customPattern.checked);
            setValue(KEYS.patternIndex, 0);
            resetTally();
            updateModeVisibility();
        });

        ui.patternText.addEventListener('input', () => {
            setValue(KEYS.customPatternText, ui.patternText.value);
            setValue(KEYS.patternIndex, 0);
            resetTally();
            updateModeVisibility();
        });

        ui.usageLimit.addEventListener('input', () => {
            setValue(KEYS.usageLimit, ui.usageLimit.value);
        });

        ui.consecutive.addEventListener('change', () => {
            setValue(KEYS.consecutive, ui.consecutive.checked);
        });

        ui.start.addEventListener('click', () => {
            if (!validateCurrentConfiguration(true)) {
                updateButtonState();
                return;
            }

            setValue(KEYS.className, ui.className.value);
            setValue(KEYS.specialization, ui.specialization.value);
            setValue(KEYS.skillName, ui.skill.value);
            setValue(KEYS.customPatternEnabled, ui.customPattern.checked);
            setValue(KEYS.customPatternText, ui.patternText.value);
            setValue(KEYS.usageLimit, ui.usageLimit.value);
            setValue(KEYS.consecutive, ui.consecutive.checked);
            setValue(KEYS.patternIndex, 0);
            resetTally();

            clearTokenWaitTimers();
            setRunning(true);

            actionPending = false;
            fastEnemyModePrepared = false;
            restartPending = false;
            matchmakingPending = false;
            firstBattleAttackPending = true;

            if (isPvPPage()) {
                setStatus('Checking Solo PvP tokens...');
                beginMatchmaking();
            } else if (isBattlePage()) {
                setStatus('Battle automation started.');
                scheduleBattleCheck(100);
            } else {
                stopAutomation('Open the PvP page to begin.', true);
            }
        });

        ui.stop.addEventListener('click', () => {
            stopAutomation('Automation paused.');
        });

        updateModeVisibility();
        updateButtonState();

        if (isRunning()) setStatus('Automation is active.');
        else if (validateCurrentConfiguration(false)) setStatus('Ready');
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${PANEL_ID} {
                position: fixed;
                top: 15px;
                right: 15px;
                width: 310px;
                max-height: calc(100vh - 30px);
                box-sizing: border-box;
                overflow: hidden;
                z-index: 999999;
                color: #ead6a0;
                background: linear-gradient(145deg, rgba(25,18,31,.98), rgba(12,10,18,.98));
                border: 1px solid #80633e;
                border-radius: 10px;
                box-shadow: 0 8px 25px rgba(0,0,0,.65), inset 0 0 20px rgba(120,80,40,.08);
                font-family: Georgia, "Times New Roman", serif;
            }

            #${PANEL_ID} .sideg-pvp-panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: 42px;
                padding: 0 10px;
                border-bottom: 1px solid rgba(128,99,62,.7);
                background: rgba(0,0,0,.2);
                user-select: none;
            }

            #${PANEL_ID} .sideg-pvp-panel-title {
                color: #efcf78;
                font-size: 16px;
                font-weight: bold;
            }

            #${PANEL_ID} .sideg-pvp-collapse-button {
                width: 30px;
                height: 30px;
                padding: 0;
                color: #f2deb0;
                background: transparent;
                border: none;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
            }

            #${PANEL_ID} .sideg-pvp-panel-content {
                max-height: calc(100vh - 72px);
                padding: 12px;
                overflow-y: auto;
            }

            #${PANEL_ID}.sideg-pvp-collapsed {
                width: 170px;
            }

            #${PANEL_ID}.sideg-pvp-collapsed .sideg-pvp-panel-content {
                display: none;
            }

            #${PANEL_ID} .sideg-pvp-field {
                margin-bottom: 12px;
            }

            #${PANEL_ID} .sideg-pvp-label {
                display: block;
                margin-bottom: 5px;
                color: #ead6a0;
                font-size: 14px;
                font-weight: bold;
            }

            #${PANEL_ID} .sideg-pvp-select,
            #${PANEL_ID} .sideg-pvp-text-input,
            #${PANEL_ID} .sideg-pvp-pattern-text {
                display: block;
                width: 100%;
                box-sizing: border-box;
                padding: 8px 9px;
                color: #f3ead6;
                background: #1c1521;
                border: 1px solid #705333;
                border-radius: 7px;
                font-family: inherit;
                font-size: 14px;
            }

            #${PANEL_ID} .sideg-pvp-pattern-text {
                min-height: 150px;
                resize: vertical;
                line-height: 1.35;
            }

            #${PANEL_ID} .sideg-pvp-text-input::placeholder,
            #${PANEL_ID} .sideg-pvp-pattern-text::placeholder {
                color: #9f909f;
            }

            #${PANEL_ID} .sideg-pvp-checkbox-field {
                display: flex;
                align-items: center;
                gap: 9px;
                margin: 2px 0 13px;
                padding: 9px;
                background: rgba(0,0,0,.16);
                border: 1px solid rgba(112,83,51,.7);
                border-radius: 7px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                user-select: none;
            }

            #${PANEL_ID} .sideg-pvp-checkbox {
                width: 17px;
                height: 17px;
                margin: 0;
                accent-color: #d4a74f;
            }

            #${PANEL_ID} .sideg-pvp-tally-section {
                margin-bottom: 12px;
                padding: 10px;
                background: rgba(0,0,0,.18);
                border: 1px solid rgba(112,83,51,.7);
                border-radius: 7px;
            }

            #${PANEL_ID} .sideg-pvp-tally-heading {
                margin-bottom: 7px;
                color: #efcf78;
                font-size: 14px;
                font-weight: bold;
            }

            #${PANEL_ID} .sideg-pvp-tally-row {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                padding: 4px 0;
            }

            #${PANEL_ID} .sideg-pvp-tally-row strong {
                min-width: 30px;
                padding: 2px 7px;
                color: #fff1bd;
                background: rgba(189,137,54,.16);
                border: 1px solid rgba(233,198,108,.3);
                border-radius: 999px;
                text-align: center;
            }

            #${PANEL_ID} .sideg-pvp-tally-empty {
                color: #b9a8b8;
                font-size: 13px;
            }

            #${PANEL_ID} .sideg-pvp-start-button,
            #${PANEL_ID} .sideg-pvp-stop-button {
                display: block;
                width: 100%;
                box-sizing: border-box;
                padding: 10px 14px;
                border-radius: 7px;
                font-family: inherit;
                font-size: 15px;
                font-weight: bold;
                cursor: pointer;
            }

            #${PANEL_ID} .sideg-pvp-start-button {
                color: #1b140a;
                background: linear-gradient(180deg, #e9c66c, #bd8936);
                border: 1px solid #f0d98e;
            }

            #${PANEL_ID} .sideg-pvp-stop-button {
                margin-top: 8px;
                color: #f9dada;
                background: linear-gradient(180deg, #723333, #4d2020);
                border: 1px solid #a95858;
            }

            #${PANEL_ID} .sideg-pvp-start-button:disabled,
            #${PANEL_ID} .sideg-pvp-stop-button:disabled {
                opacity: .45;
                cursor: not-allowed;
            }

            #${PANEL_ID} .sideg-pvp-status {
                min-height: 18px;
                margin-top: 10px;
                color: #d6c08a;
                font-size: 13px;
                line-height: 18px;
                overflow-wrap: anywhere;
            }
        `;

        document.head.appendChild(style);
    }

    injectStyles();
    createPanel();
    renderTally();

    if (isBattlePage() && isRunning()) {
        actionPending = false;
        fastEnemyModePrepared = false;
        restartPending = false;
        matchmakingPending = false;
        firstBattleAttackPending = true;
        setStatus('Battle automation is active.');
        scheduleBattleCheck(200);
    }

    if (isPvPPage() && isRunning()) {
        matchmakingPending = false;

        if (hasReachedUsageLimit()) {
            stopAutomation('Selected skill usage limit reached.');
        } else {
            setStatus('Checking Solo PvP tokens...');
            setTimeout(() => {
                if (isRunning()) beginMatchmaking();
            }, DELAYS.nextMatch);
        }
    }
})();
