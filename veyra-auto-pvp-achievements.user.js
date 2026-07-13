// ==UserScript==
// @name         Veyra - Auto PvP For Achievements
// @namespace    https://github.com/sideG1030/
// @version      1.0.0
// @description  Automates PvP attacks for achievements
// @author       sideG
// @match        *://*/pvp.php*
// @match        *://*/pvp_battle.php*

// @updateURL    https://raw.githubusercontent.com/sideG1030/Veyra-Auto-PvP-Achievements/main/veyra-auto-pvp-achievements.user.js
// @downloadURL  https://raw.githubusercontent.com/sideG1030/Veyra-Auto-PvP-Achievements/main/veyra-auto-pvp-achievements.user.js

// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const PANEL_ID = 'sideg-pvp-control-panel';
    const STYLE_ID = 'sideg-pvp-panel-styles';

    const STORAGE_KEYS = {
        collapsed: 'sidegPvpPanelCollapsed',
        className: 'sidegPvpClass',
        subclassName: 'sidegPvpSubclass',
        skillName: 'sidegPvpSkill',
        running: 'sidegPvpRunning',
        consecutiveBattles: 'sidegPvpConsecutiveBattles',
        usageLimit: 'sidegPvpUsageLimit',
        selectedSkillCount: 'sidegPvpSelectedSkillCount',
        slashCount: 'sidegPvpSlashCount',
        countedSkillName: 'sidegPvpCountedSkillName'
    };

    const SUBCLASS_OPTIONS = {
        Mage: [
            'Grand Mage',
            'Magic Knight'
        ],
        Warrior: [
            'Paladin',
            'Berserker'
        ],
        Cleric: [
            'Saint',
            'Inquisitor'
        ],
        Hunter: [
            'Assassin',
            'Archer'
        ]
    };

    /*
     * Shared skills.
     */
    const UNIVERSAL_SKILLS = [
        {
            name: 'Slash',
            skillId: '0'
        },
        {
            name: 'Power Slash',
            skillId: '-1'
        }
    ];

    const MAGE_SKILLS = [
        {
            name: 'Fireball',
            skillId: '4'
        },
        {
            name: 'Arcane Sacrifice',
            skillId: '5'
        }
    ];

    const WARRIOR_SKILLS = [
        {
            name: 'Ironclad Strike',
            skillId: '2'
        },
        {
            name: 'Warrior Aura',
            skillId: '3'
        },
        {
            name: 'Blood Pact',
            skillId: '19'
        },
        {
            name: 'Taunt',
            skillId: '20'
        }
    ];

    const CLERIC_SKILLS = [
        {
            name: 'Heal',
            skillId: '8'
        },
        {
            name: 'Judgement Seal',
            skillId: '9'
        },
        {
            name: 'Sanctified Breach',
            skillId: '18'
        }
    ];

    const HUNTER_SKILLS = [
        {
            name: 'Backstab',
            skillId: '6'
        },
        {
            name: 'Killer Instinct',
            skillId: '7'
        }
    ];

    /*
     * Complete specialization skill lists.
     */
    const SKILLS_BY_SPECIALIZATION = {
        Paladin: [
            ...UNIVERSAL_SKILLS,
            ...WARRIOR_SKILLS,
            {
                name: 'Radiant Guard',
                skillId: 'adv:1'
            },
            {
                name: 'Judgement Bash',
                skillId: 'adv:2'
            },
            {
                name: 'Aegis Intervention',
                skillId: 'adv:3'
            },
            {
                name: 'Sanctified Verdict',
                skillId: 'adv:4',
                requiresFullResource: true
            }
        ],

        Berserker: [
            ...UNIVERSAL_SKILLS,
            ...WARRIOR_SKILLS,
            {
                name: 'Skull Splitter',
                skillId: 'adv:6'
            },
            {
                name: 'Rampage Howl',
                skillId: 'adv:7'
            },
            {
                name: 'Ragnarock Heal',
                skillId: 'adv:8',
                requiresFullResource: true
            }
        ],

        'Grand Mage': [
            ...UNIVERSAL_SKILLS,
            ...MAGE_SKILLS,
            {
                name: 'Meteor Sigil',
                skillId: 'adv:9'
            },
            {
                name: 'Mana Collapse',
                skillId: 'adv:10'
            },
            {
                name: 'Elemental Dominion',
                skillId: 'adv:11'
            },
            {
                name: 'Astral Cataclysm',
                skillId: 'adv:12',
                requiresFullResource: true
            }
        ],

        'Magic Knight': [
            ...UNIVERSAL_SKILLS,
            ...MAGE_SKILLS,
            {
                name: 'Runebound Slash',
                skillId: 'adv:13'
            },
            {
                name: 'Spell Breaker Cut',
                skillId: 'adv:14'
            },
            {
                name: 'Mirror Aegis',
                skillId: 'adv:15'
            },
            {
                name: 'Eclipse Sever',
                skillId: 'adv:16',
                requiresFullResource: true
            }
        ],

        Assassin: [
            ...UNIVERSAL_SKILLS,
            ...HUNTER_SKILLS,
            {
                name: 'Venom Rend',
                skillId: 'adv:18'
            },
            {
                name: 'Death Mark',
                skillId: 'adv:19'
            },
            {
                name: 'Final Wish',
                skillId: 'adv:20',
                requiresFullResource: true
            }
        ],

        Archer: [
            ...UNIVERSAL_SKILLS,
            ...HUNTER_SKILLS,
            {
                name: 'Poison Bloom',
                skillId: 'adv:21'
            },
            {
                name: 'Deadeye Release',
                skillId: 'adv:22'
            },
            {
                name: 'Blacksky Volley',
                skillId: 'adv:23'
            },
            {
                name: 'Piercing Starshot',
                skillId: 'adv:24',
                requiresFullResource: true
            }
        ],

        Inquisitor: [
            ...UNIVERSAL_SKILLS,
            ...CLERIC_SKILLS,
            {
                name: 'Brand of Guilt',
                skillId: 'adv:25'
            },
            {
                name: 'Purifying Flame',
                skillId: 'adv:26'
            },
            {
                name: 'Confession Breaker',
                skillId: 'adv:27'
            },
            {
                name: 'Final Sentence',
                skillId: 'adv:28',
                requiresFullResource: true
            }
        ],

        Saint: [
            ...UNIVERSAL_SKILLS,
            ...CLERIC_SKILLS,
            {
                name: 'Blessed Recovery',
                skillId: 'adv:29'
            },
            {
                name: 'Divine Barrier',
                skillId: 'adv:30'
            },
            {
                name: 'Heaven Mercy',
                skillId: 'adv:32',
                requiresFullResource: true
            }
        ]
    };

    const BATTLE_CHECK_DELAY = 300;
    const TARGET_SELECTION_DELAY = 150;
    const AFTER_SKILL_DELAY = 800;
    const BATTLE_END_DELAY = 1000;
    const NEXT_MATCH_DELAY = 1000;

    /*
     * Check slightly after the exact server-hour boundary so the
     * server has time to apply the token refill.
     */
    const SERVER_HOUR_BUFFER = 5000;

    /*
     * Update the waiting countdown every second.
     */
    const TOKEN_COUNTDOWN_INTERVAL = 1000;

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

    let panelStatusElement = null;
    let startButtonElement = null;
    let stopButtonElement = null;

    let subclassSelectElement = null;
    let skillSelectElement = null;

    let tallySectionElement = null;
    let primaryTallyLabelElement = null;
    let primaryTallyValueElement = null;
    let slashTallyRowElement = null;
    let slashTallyValueElement = null;

    /*
     * ============================================================
     * General state helpers
     * ============================================================
     */

    function isPvPPage() {
        return location.pathname.endsWith('/pvp.php');
    }

    function isBattlePage() {
        return location.pathname.endsWith('/pvp_battle.php');
    }

    function isAutomationRunning() {
        return GM_getValue(
            STORAGE_KEYS.running,
            false
        );
    }

    function setAutomationRunning(running) {
        GM_setValue(
            STORAGE_KEYS.running,
            running
        );

        updatePanelButtonState();
    }

    function isConsecutiveBattlesEnabled() {
        return GM_getValue(
            STORAGE_KEYS.consecutiveBattles,
            false
        );
    }

    function getSelectedSpecialization() {
        return GM_getValue(
            STORAGE_KEYS.subclassName,
            'Grand Mage'
        );
    }

    function getSelectedSkillName() {
        return GM_getValue(
            STORAGE_KEYS.skillName,
            'Slash'
        );
    }

    function getSkillsForSpecialization(specialization) {
        return SKILLS_BY_SPECIALIZATION[specialization] ?? [];
    }

    function getSkillDefinition(
        specialization,
        skillName
    ) {
        return getSkillsForSpecialization(
            specialization
        ).find(
            skill => skill.name === skillName
        ) ?? null;
    }

    function isSelectedSkillConfigured() {
        const specialization =
            subclassSelectElement?.value ??
            getSelectedSpecialization();

        const skillName =
            skillSelectElement?.value ??
            getSelectedSkillName();

        const skill = getSkillDefinition(
            specialization,
            skillName
        );

        return Boolean(
            skill &&
            skill.skillId !== null &&
            skill.skillId !== undefined &&
            String(skill.skillId).trim() !== ''
        );
    }

    function setStatus(message, isError = false) {
        if (!panelStatusElement) {
            return;
        }

        panelStatusElement.textContent = message;

        panelStatusElement.style.color = isError
            ? '#ff8a8a'
            : '#d6c08a';
    }

    function updatePanelButtonState() {
        const running = isAutomationRunning();
        const configured = isSelectedSkillConfigured();

        if (startButtonElement) {
            startButtonElement.disabled =
                running || !configured;
        }

        if (stopButtonElement) {
            stopButtonElement.disabled = !running;
        }
    }

    function updateSkillAvailabilityMessage() {
        if (!skillSelectElement) {
            return;
        }

        const specialization =
            subclassSelectElement?.value ?? '';

        const selectedSkill =
            skillSelectElement.value;

        const skill = getSkillDefinition(
            specialization,
            selectedSkill
        );

        updatePanelButtonState();

        if (!skill) {
            setStatus(
                'Skills for this specialization have not been added.',
                true
            );

            return;
        }

        if (
            skill.skillId === null ||
            skill.skillId === undefined ||
            String(skill.skillId).trim() === ''
        ) {
            setStatus(
                `${selectedSkill} cannot be automated until its ID is known.`,
                true
            );

            return;
        }

        if (!isAutomationRunning()) {
            setStatus('Ready');
        }
    }

    function isElementVisible(element) {
        if (!element) {
            return false;
        }

        const style = window.getComputedStyle(element);

        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden'
        );
    }

    function isButtonUsable(button) {
        if (!button) {
            return false;
        }

        return !(
            button.disabled ||
            button.hasAttribute('disabled') ||
            button.getAttribute('aria-disabled') === 'true'
        );
    }

    /*
     * ============================================================
     * Usage limit and tally
     * ============================================================
     */

    function parseUsageLimit(value) {
        const text = String(value ?? '').trim();

        if (text === '') {
            return 0;
        }

        const number = Number(text);

        if (
            !Number.isFinite(number) ||
            number <= 0
        ) {
            return 0;
        }

        return Math.floor(number);
    }

    function getUsageLimit() {
        return parseUsageLimit(
            GM_getValue(
                STORAGE_KEYS.usageLimit,
                '0'
            )
        );
    }

    function resetSkillCounts(selectedSkill) {
        GM_setValue(
            STORAGE_KEYS.selectedSkillCount,
            0
        );

        GM_setValue(
            STORAGE_KEYS.slashCount,
            0
        );

        GM_setValue(
            STORAGE_KEYS.countedSkillName,
            selectedSkill
        );

        updateTallyDisplay();
    }

    function ensureCountedSkillMatchesSelection() {
        const selectedSkill =
            getSelectedSkillName();

        const countedSkill = GM_getValue(
            STORAGE_KEYS.countedSkillName,
            selectedSkill
        );

        if (countedSkill !== selectedSkill) {
            resetSkillCounts(selectedSkill);
        }
    }

    function incrementSkillCount(usedSkillName) {
        const selectedSkill =
            getSelectedSkillName();

        ensureCountedSkillMatchesSelection();

        if (usedSkillName === selectedSkill) {
            const count = Number(
                GM_getValue(
                    STORAGE_KEYS.selectedSkillCount,
                    0
                )
            ) || 0;

            GM_setValue(
                STORAGE_KEYS.selectedSkillCount,
                count + 1
            );
        }

        if (
            usedSkillName === 'Slash' &&
            selectedSkill !== 'Slash'
        ) {
            const count = Number(
                GM_getValue(
                    STORAGE_KEYS.slashCount,
                    0
                )
            ) || 0;

            GM_setValue(
                STORAGE_KEYS.slashCount,
                count + 1
            );
        }

        updateTallyDisplay();
    }

    function hasReachedUsageLimit() {
        const limit = getUsageLimit();

        if (limit <= 0) {
            return false;
        }

        const count = Number(
            GM_getValue(
                STORAGE_KEYS.selectedSkillCount,
                0
            )
        ) || 0;

        return count >= limit;
    }

    function updateTallyDisplay() {
        if (
            !tallySectionElement ||
            !primaryTallyLabelElement ||
            !primaryTallyValueElement ||
            !slashTallyRowElement ||
            !slashTallyValueElement
        ) {
            return;
        }

        const selectedSkill =
            getSelectedSkillName();

        const selectedCount = Number(
            GM_getValue(
                STORAGE_KEYS.selectedSkillCount,
                0
            )
        ) || 0;

        const slashCount = Number(
            GM_getValue(
                STORAGE_KEYS.slashCount,
                0
            )
        ) || 0;

        primaryTallyLabelElement.textContent =
            selectedSkill || 'Selected skill';

        primaryTallyValueElement.textContent =
            String(selectedCount);

        if (selectedSkill === 'Slash') {
            slashTallyRowElement.style.display = 'none';
        } else {
            slashTallyRowElement.style.display = 'flex';
            slashTallyValueElement.textContent =
                String(slashCount);
        }

        tallySectionElement.style.display = 'block';
    }

    /*
     * ============================================================
     * Solo PvP token detection
     * ============================================================
     */

    function getFindSoloMatchButton() {
        return document.querySelector(
            'button.action-btn.js-matchmake[data-ladder="solo"]'
        );
    }

    function findTokenValueInContainer(container) {
        if (!container) {
            return null;
        }

        const pills = container.querySelectorAll(
            '.info-pill'
        );

        for (const pill of pills) {
            const strong = pill.querySelector('strong');

            if (!strong) {
                continue;
            }

            const label = strong.textContent
                .trim()
                .replace(/:$/, '')
                .toLowerCase();

            if (label !== 'tokens') {
                continue;
            }

            const span = pill.querySelector('span');

            if (!span) {
                continue;
            }

            const parsed = Number.parseInt(
                span.textContent.trim(),
                10
            );

            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }

        return null;
    }

    function getSoloPvPTokens() {
        const matchButton =
            getFindSoloMatchButton();

        /*
         * Search upward from the Solo Match button so that party
         * tokens are not mistaken for solo tokens.
         */
        let container = matchButton?.parentElement ?? null;

        for (
            let depth = 0;
            container && depth < 8;
            depth += 1
        ) {
            const value =
                findTokenValueInContainer(container);

            if (value !== null) {
                return value;
            }

            container = container.parentElement;
        }

        /*
         * Fallback: search all token pills and prefer one located
         * near text mentioning the solo ladder.
         */
        const pills = document.querySelectorAll(
            '.info-pill'
        );

        for (const pill of pills) {
            const strong = pill.querySelector('strong');
            const span = pill.querySelector('span');

            if (!strong || !span) {
                continue;
            }

            const label = strong.textContent
                .trim()
                .replace(/:$/, '')
                .toLowerCase();

            if (label !== 'tokens') {
                continue;
            }

            let ancestor = pill.parentElement;
            let ancestorText = '';

            for (
                let depth = 0;
                ancestor && depth < 5;
                depth += 1
            ) {
                ancestorText =
                    ancestor.textContent.toLowerCase();

                if (
                    ancestorText.includes('solo ladder') ||
                    ancestor.querySelector(
                        'button.js-matchmake[data-ladder="solo"]'
                    )
                ) {
                    const parsed = Number.parseInt(
                        span.textContent.trim(),
                        10
                    );

                    return Number.isFinite(parsed)
                        ? parsed
                        : null;
                }

                ancestor = ancestor.parentElement;
            }
        }

        return null;
    }

    /*
     * ============================================================
     * Server clock
     * ============================================================
     */

    function refreshServerClockBase() {
        const serverTimeElement =
            document.getElementById('server_time');

        if (!serverTimeElement) {
            return false;
        }

        const attributeValue =
            serverTimeElement.dataset.epoch;

        const epoch = Number(attributeValue);

        if (!Number.isFinite(epoch)) {
            return false;
        }

        /*
         * If the website updates data-epoch itself, refresh our
         * reference point. Otherwise, advance it using Date.now().
         */
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

        const elapsedSeconds = Math.floor(
            (
                Date.now() -
                serverClockBaseBrowserTime
            ) / 1000
        );

        return serverClockBaseEpoch + elapsedSeconds;
    }

    function getServerTimezoneOffset() {
        const serverTimeElement =
            document.getElementById('server_time');

        const offset = Number(
            serverTimeElement?.dataset.tzoff
        );

        return Number.isFinite(offset)
            ? offset
            : 0;
    }

    function getNextServerHourEpoch() {
        const currentEpoch =
            getCurrentServerEpoch();

        const timezoneOffset =
            getServerTimezoneOffset();

        /*
         * Shift into server-local time, calculate the next whole
         * local hour, and then shift back to Unix epoch time.
         *
         * This also works for half-hour time zones such as +05:30.
         */
        const serverLocalEpoch =
            currentEpoch + timezoneOffset;

        const nextLocalHour =
            (
                Math.floor(
                    serverLocalEpoch / 3600
                ) + 1
            ) * 3600;

        return nextLocalHour - timezoneOffset;
    }

    function formatDuration(totalSeconds) {
        const safeSeconds = Math.max(
            0,
            Math.ceil(totalSeconds)
        );

        const hours = Math.floor(
            safeSeconds / 3600
        );

        const minutes = Math.floor(
            (safeSeconds % 3600) / 60
        );

        const seconds =
            safeSeconds % 60;

        if (hours > 0) {
            return (
                `${hours}:` +
                `${String(minutes).padStart(2, '0')}:` +
                `${String(seconds).padStart(2, '0')}`
            );
        }

        return (
            `${minutes}:` +
            `${String(seconds).padStart(2, '0')}`
        );
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

    function updateTokenWaitCountdown(
        targetEpoch
    ) {
        if (!isAutomationRunning()) {
            clearTokenWaitTimers();
            return;
        }

        const remaining =
            targetEpoch - getCurrentServerEpoch();

        setStatus(
            `No Solo PvP tokens. Next server hour in ${formatDuration(remaining)}.`
        );
    }

    function waitForNextServerHour() {
        clearTokenWaitTimers();

        if (!isAutomationRunning()) {
            return;
        }

        matchmakingPending = false;

        const nextHourEpoch =
            getNextServerHourEpoch();

        updateTokenWaitCountdown(
            nextHourEpoch
        );

        tokenCountdownTimer = setInterval(
            () => {
                updateTokenWaitCountdown(
                    nextHourEpoch
                );
            },
            TOKEN_COUNTDOWN_INTERVAL
        );

        const delayMilliseconds = Math.max(
            1000,
            (
                nextHourEpoch -
                getCurrentServerEpoch()
            ) * 1000 +
            SERVER_HOUR_BUFFER
        );

        tokenWaitTimer = setTimeout(
            () => {
                clearTokenWaitTimers();

                if (!isAutomationRunning()) {
                    return;
                }

                setStatus(
                    'Server hour passed. Checking Solo PvP tokens...'
                );

                /*
                 * Reload pvp.php so the displayed token count is
                 * refreshed from the server.
                 */
                location.reload();
            },
            delayMilliseconds
        );
    }

    /*
     * ============================================================
     * Matchmaking
     * ============================================================
     */

    function beginMatchmaking() {
        if (
            matchmakingPending ||
            !isAutomationRunning()
        ) {
            return;
        }

        clearTokenWaitTimers();

        const tokenCount =
            getSoloPvPTokens();

        /*
         * A value of null means the page has not finished rendering
         * the Solo Ladder information yet.
         */
        if (tokenCount === null) {
            setStatus(
                'Waiting for the Solo PvP token count...'
            );

            setTimeout(() => {
                if (isAutomationRunning()) {
                    beginMatchmaking();
                }
            }, 500);

            return;
        }

        if (tokenCount <= 0) {
            waitForNextServerHour();
            return;
        }

        const matchButton =
            getFindSoloMatchButton();

        if (!matchButton) {
            setStatus(
                'The "Find Solo Match" button was not found.',
                true
            );

            setTimeout(() => {
                if (isAutomationRunning()) {
                    beginMatchmaking();
                }
            }, 1000);

            return;
        }

        if (!isButtonUsable(matchButton)) {
            setStatus(
                'The "Find Solo Match" button is currently unavailable.'
            );

            setTimeout(() => {
                if (isAutomationRunning()) {
                    beginMatchmaking();
                }
            }, 1000);

            return;
        }

        matchmakingPending = true;

        setStatus(
            `Starting solo matchmaking. Tokens remaining: ${tokenCount}.`
        );

        matchButton.click();
    }

    /*
     * ============================================================
     * Battle-finished detection
     * ============================================================
     */

    function getElementText(id) {
        const element =
            document.getElementById(id);

        return element
            ? element.textContent.trim().toLowerCase()
            : '';
    }

    function getLatestBattleLogText() {
        const lines = document.querySelectorAll(
            '.logLine .logText'
        );

        if (lines.length === 0) {
            return '';
        }

        return lines[
            lines.length - 1
        ].textContent.trim().toLowerCase();
    }

    function isFinishedStatusText(text) {
        return Boolean(
            text && (
                text.includes('victory') ||
                text.includes('defeat') ||
                text.includes('draw') ||
                text.includes('won') ||
                text.includes('lost') ||
                text.includes('finished') ||
                text.includes('complete')
            )
        );
    }

    function isFinishedResultText(text) {
        return Boolean(
            text && (
                text.includes('won this season match') ||
                text.includes('wins the room') ||
                text.includes('victory') ||
                text.includes('defeat') ||
                text.includes('battle ended') ||
                text.includes('match ended')
            )
        );
    }

    function isBattleOver() {
        if (
            isFinishedStatusText(
                getElementText('matchStatusBadge')
            )
        ) {
            return true;
        }

        if (
            isFinishedResultText(
                getElementText('noteText')
            )
        ) {
            return true;
        }

        if (
            isFinishedResultText(
                getLatestBattleLogText()
            )
        ) {
            return true;
        }

        const rewardsModal =
            document.getElementById('rewardsModal');

        return Boolean(
            rewardsModal &&
            rewardsModal.classList.contains('show')
        );
    }

    function getBackToPvPButton() {
        const links =
            document.querySelectorAll('a.back-btn');

        for (const link of links) {
            const href =
                link.getAttribute('href') ?? '';

            if (
                href === 'pvp.php' ||
                href.endsWith('/pvp.php')
            ) {
                return link;
            }
        }

        return null;
    }

    function handleBattleFinished() {
        if (restartPending) {
            return;
        }

        restartPending = true;
        actionPending = false;

        clearBattleTimer();

        if (hasReachedUsageLimit()) {
            const selectedSkill =
                getSelectedSkillName();

            const count = Number(
                GM_getValue(
                    STORAGE_KEYS.selectedSkillCount,
                    0
                )
            ) || 0;

            stopAutomation(
                `${selectedSkill} used ${count} times. Limit reached.`
            );

            return;
        }

        if (!isConsecutiveBattlesEnabled()) {
            stopAutomation('Battle finished.');
            return;
        }

        setStatus(
            'Battle finished. Returning to the PvP page...'
        );

        setTimeout(() => {
            if (!isAutomationRunning()) {
                restartPending = false;
                return;
            }

            const backButton =
                getBackToPvPButton();

            if (backButton) {
                backButton.click();
            } else {
                location.href = 'pvp.php';
            }
        }, BATTLE_END_DELAY);
    }

    /*
     * ============================================================
     * Enemy Turns 1s
     * ============================================================
     */

    function prepareFastEnemyMode() {
        if (fastEnemyModePrepared) {
            return true;
        }

        const button =
            document.getElementById('fastEnemyBtn');

        if (!button) {
            return false;
        }

        if (button.classList.contains('active')) {
            fastEnemyModePrepared = true;
            return true;
        }

        if (!isButtonUsable(button)) {
            return false;
        }

        button.click();
        fastEnemyModePrepared = true;

        return true;
    }

    /*
     * ============================================================
     * Enemy targeting
     * ============================================================
     */

    function getSelectedEnemyTarget() {
        return document.querySelector(
            '#enemyFormation .pSlot.targeted'
        );
    }

    function getLivingEnemyTarget() {
        const targets = document.querySelectorAll(
            '#enemyFormation .pSlot'
        );

        for (const target of targets) {
            const alive =
                target.dataset.alive === '1' ||
                !target.classList.contains('dead');

            if (
                alive &&
                isElementVisible(target)
            ) {
                return target;
            }
        }

        return null;
    }

    function ensureEnemyTargetSelected() {
        if (getSelectedEnemyTarget()) {
            return {
                ready: true,
                newlySelected: false
            };
        }

        const target =
            getLivingEnemyTarget();

        if (!target) {
            return {
                ready: false,
                newlySelected: false
            };
        }

        target.click();

        return {
            ready: true,
            newlySelected: true
        };
    }

    /*
     * ============================================================
     * Skills
     * ============================================================
     */

    function getSkillButtonById(skillId) {
        const buttons = document.querySelectorAll(
            '#skillsGrid button.skillCard'
        );

        for (const button of buttons) {
            if (
                button.dataset.skillId ===
                String(skillId)
            ) {
                return button;
            }
        }

        return null;
    }

    function getSkillButtonByName(skillName) {
        const buttons = document.querySelectorAll(
            '#skillsGrid button.skillCard'
        );

        for (const button of buttons) {
            const name =
                button.querySelector('.skillName');

            if (
                name &&
                name.textContent.trim() === skillName
            ) {
                return button;
            }
        }

        return null;
    }

    function getConfiguredSkillButton(skillName) {
        const specialization =
            getSelectedSpecialization();

        const skill = getSkillDefinition(
            specialization,
            skillName
        );

        if (
            !skill ||
            skill.skillId === null ||
            skill.skillId === undefined
        ) {
            return null;
        }

        return (
            getSkillButtonById(skill.skillId) ??
            getSkillButtonByName(skill.name)
        );
    }

    function getSlashButton() {
        return (
            getSkillButtonById('0') ??
            getSkillButtonByName('Slash')
        );
    }

    function getPowerSlashButton() {
        return (
            getSkillButtonById('-1') ??
            getSkillButtonByName('Power Slash')
        );
    }

    function selectedSkillRequiresFullResource() {
        const specialization =
            getSelectedSpecialization();

        const selectedSkill =
            getSelectedSkillName();

        const definition = getSkillDefinition(
            specialization,
            selectedSkill
        );

        if (definition?.requiresFullResource === true) {
            return true;
        }

        const button =
            getConfiguredSkillButton(selectedSkill);

        return Boolean(
            button &&
            button.dataset.requiresFullResource === '1'
        );
    }

    function chooseSkillButton() {
        const selectedSkill =
            getSelectedSkillName();

        /*
         * Open a battle with Power Slash when the selected skill
         * requires a full 100-charge resource bar.
         */
        if (
            firstBattleAttackPending &&
            selectedSkillRequiresFullResource()
        ) {
            const powerSlashButton =
                getPowerSlashButton();

            if (isButtonUsable(powerSlashButton)) {
                return {
                    button: powerSlashButton,
                    skillName: 'Power Slash',
                    fallback: true,
                    openingPowerSlash: true
                };
            }

            return null;
        }

        const selectedButton =
            getConfiguredSkillButton(selectedSkill);

        if (isButtonUsable(selectedButton)) {
            return {
                button: selectedButton,
                skillName: selectedSkill,
                fallback: false,
                openingPowerSlash: false
            };
        }

        const slashButton =
            getSlashButton();

        if (isButtonUsable(slashButton)) {
            return {
                button: slashButton,
                skillName: 'Slash',
                fallback: true,
                openingPowerSlash: false
            };
        }

        return null;
    }

    /*
     * ============================================================
     * Battle automation
     * ============================================================
     */

    function clearBattleTimer() {
        if (battleTimer !== null) {
            clearTimeout(battleTimer);
            battleTimer = null;
        }
    }

    function scheduleBattleCheck(
        delay = BATTLE_CHECK_DELAY
    ) {
        clearBattleTimer();

        if (!isAutomationRunning()) {
            return;
        }

        battleTimer = setTimeout(() => {
            battleTimer = null;
            runBattleAutomation();
        }, delay);
    }

    function stopAutomation(
        message = 'Automation paused.',
        isError = false
    ) {
        setAutomationRunning(false);

        actionPending = false;
        fastEnemyModePrepared = false;
        restartPending = false;
        matchmakingPending = false;
        firstBattleAttackPending = true;

        clearBattleTimer();
        clearTokenWaitTimers();

        setStatus(message, isError);
    }

    function clickSelectedSkill() {
        if (!isAutomationRunning()) {
            actionPending = false;
            return;
        }

        if (isBattleOver()) {
            handleBattleFinished();
            return;
        }

        const choice =
            chooseSkillButton();

        if (!choice) {
            actionPending = false;
            scheduleBattleCheck();
            return;
        }

        choice.button.click();

        firstBattleAttackPending = false;

        incrementSkillCount(
            choice.skillName
        );

        if (choice.openingPowerSlash) {
            setStatus(
                'Used Power Slash as the opening attack.'
            );
        } else if (choice.fallback) {
            setStatus(
                `Used Slash because ${getSelectedSkillName()} was unavailable.`
            );
        } else {
            setStatus(
                `Used ${choice.skillName}.`
            );
        }

        setTimeout(() => {
            actionPending = false;

            if (isAutomationRunning()) {
                scheduleBattleCheck();
            }
        }, AFTER_SKILL_DELAY);
    }

    function runBattleAutomation() {
        if (!isAutomationRunning()) {
            clearBattleTimer();
            return;
        }

        if (!isBattlePage()) {
            return;
        }

        if (isBattleOver()) {
            handleBattleFinished();
            return;
        }

        if (!prepareFastEnemyMode()) {
            scheduleBattleCheck();
            return;
        }

        if (actionPending) {
            scheduleBattleCheck();
            return;
        }

        const skillsGrid =
            document.getElementById('skillsGrid');

        if (
            !skillsGrid ||
            !skillsGrid.querySelector('button.skillCard')
        ) {
            scheduleBattleCheck();
            return;
        }

        const targetResult =
            ensureEnemyTargetSelected();

        if (!targetResult.ready) {
            scheduleBattleCheck();
            return;
        }

        actionPending = true;

        if (targetResult.newlySelected) {
            setTimeout(
                clickSelectedSkill,
                TARGET_SELECTION_DELAY
            );
        } else {
            clickSelectedSkill();
        }
    }

    /*
     * ============================================================
     * Panel helpers
     * ============================================================
     */

    function createSelectField(labelText, id) {
        const wrapper =
            document.createElement('div');

        wrapper.className = 'sideg-pvp-field';

        const label =
            document.createElement('label');

        label.className = 'sideg-pvp-label';
        label.htmlFor = id;
        label.textContent = labelText;

        const select =
            document.createElement('select');

        select.id = id;
        select.className = 'sideg-pvp-select';

        wrapper.append(label, select);

        return {
            wrapper,
            select
        };
    }

    function createTextInputField(
        labelText,
        id,
        placeholder
    ) {
        const wrapper =
            document.createElement('div');

        wrapper.className = 'sideg-pvp-field';

        const label =
            document.createElement('label');

        label.className = 'sideg-pvp-label';
        label.htmlFor = id;
        label.textContent = labelText;

        const input =
            document.createElement('input');

        input.id = id;
        input.type = 'text';
        input.inputMode = 'numeric';
        input.className = 'sideg-pvp-text-input';
        input.placeholder = placeholder;
        input.autocomplete = 'off';

        wrapper.append(label, input);

        return {
            wrapper,
            input
        };
    }

    function createCheckboxField(labelText, id) {
        const wrapper =
            document.createElement('label');

        wrapper.className =
            'sideg-pvp-checkbox-field';

        const checkbox =
            document.createElement('input');

        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.className =
            'sideg-pvp-checkbox';

        const text =
            document.createElement('span');

        text.textContent = labelText;

        wrapper.append(checkbox, text);

        return {
            wrapper,
            checkbox
        };
    }

    function createTallySection() {
        const section =
            document.createElement('div');

        section.className =
            'sideg-pvp-tally-section';

        const heading =
            document.createElement('div');

        heading.className =
            'sideg-pvp-tally-heading';

        heading.textContent = 'Skill tally';

        const primaryRow =
            document.createElement('div');

        primaryRow.className =
            'sideg-pvp-tally-row';

        const primaryLabel =
            document.createElement('span');

        const primaryValue =
            document.createElement('strong');

        primaryRow.append(
            primaryLabel,
            primaryValue
        );

        const slashRow =
            document.createElement('div');

        slashRow.className =
            'sideg-pvp-tally-row';

        const slashLabel =
            document.createElement('span');

        slashLabel.textContent = 'Slash';

        const slashValue =
            document.createElement('strong');

        slashRow.append(
            slashLabel,
            slashValue
        );

        section.append(
            heading,
            primaryRow,
            slashRow
        );

        return {
            section,
            primaryLabel,
            primaryValue,
            slashRow,
            slashValue
        };
    }

    function setSelectOptions(
        select,
        options,
        selectedValue = ''
    ) {
        select.innerHTML = '';

        for (const text of options) {
            const option =
                document.createElement('option');

            option.value = text;
            option.textContent = text;

            select.appendChild(option);
        }

        if (options.includes(selectedValue)) {
            select.value = selectedValue;
        }
    }

    function updateSubclassOptions(
        classSelect,
        subclassSelect,
        savedSubclass = ''
    ) {
        const subclasses =
            SUBCLASS_OPTIONS[classSelect.value] ?? [];

        setSelectOptions(
            subclassSelect,
            subclasses,
            savedSubclass
        );

        GM_setValue(
            STORAGE_KEYS.subclassName,
            subclassSelect.value
        );
    }

    function updateSkillOptions(
        subclassSelect,
        skillSelect,
        savedSkill = ''
    ) {
        const specialization =
            subclassSelect.value;

        const skills =
            getSkillsForSpecialization(
                specialization
            );

        skillSelect.innerHTML = '';

        if (skills.length === 0) {
            const option =
                document.createElement('option');

            option.value = '';
            option.textContent =
                'Skills not added yet';

            skillSelect.appendChild(option);
            skillSelect.disabled = true;

            GM_setValue(
                STORAGE_KEYS.skillName,
                ''
            );

            updatePanelButtonState();
            updateSkillAvailabilityMessage();
            return;
        }

        skillSelect.disabled = false;

        const names =
            skills.map(skill => skill.name);

        setSelectOptions(
            skillSelect,
            names,
            savedSkill
        );

        if (!names.includes(savedSkill)) {
            skillSelect.value = names[0];
        }

        GM_setValue(
            STORAGE_KEYS.skillName,
            skillSelect.value
        );

        ensureCountedSkillMatchesSelection();
        updateTallyDisplay();
        updatePanelButtonState();
        updateSkillAvailabilityMessage();
    }

    /*
     * ============================================================
     * Control panel
     * ============================================================
     */

    function createControlPanel() {
        if (document.getElementById(PANEL_ID)) {
            return;
        }

        const panel =
            document.createElement('div');

        panel.id = PANEL_ID;

        const header =
            document.createElement('div');

        header.className =
            'sideg-pvp-panel-header';

        const title =
            document.createElement('div');

        title.className =
            'sideg-pvp-panel-title';

        title.textContent = 'Auto PvP';

        const collapseButton =
            document.createElement('button');

        collapseButton.className =
            'sideg-pvp-collapse-button';

        collapseButton.type = 'button';

        const content =
            document.createElement('div');

        content.className =
            'sideg-pvp-panel-content';

        const classField =
            createSelectField(
                'Class',
                'sideg-pvp-class-select'
            );

        const subclassField =
            createSelectField(
                'Specialization',
                'sideg-pvp-subclass-select'
            );

        const skillField =
            createSelectField(
                'Skill',
                'sideg-pvp-skill-select'
            );

        subclassSelectElement =
            subclassField.select;

        skillSelectElement =
            skillField.select;

        setSelectOptions(
            classField.select,
            [
                'Mage',
                'Warrior',
                'Cleric',
                'Hunter'
            ]
        );

        const usageLimitField =
            createTextInputField(
                'Selected skill usage target',
                'sideg-pvp-usage-limit',
                'Input 0 to ignore the count.'
            );

        const tally =
            createTallySection();

        tallySectionElement =
            tally.section;

        primaryTallyLabelElement =
            tally.primaryLabel;

        primaryTallyValueElement =
            tally.primaryValue;

        slashTallyRowElement =
            tally.slashRow;

        slashTallyValueElement =
            tally.slashValue;

        const consecutiveField =
            createCheckboxField(
                'Consecutive battles',
                'sideg-pvp-consecutive-checkbox'
            );

        const startButton =
            document.createElement('button');

        startButton.className =
            'sideg-pvp-start-button';

        startButton.type = 'button';
        startButton.textContent = 'Start PvP';

        const stopButton =
            document.createElement('button');

        stopButton.className =
            'sideg-pvp-stop-button';

        stopButton.type = 'button';
        stopButton.textContent = 'Stop PvP';

        const status =
            document.createElement('div');

        status.className =
            'sideg-pvp-status';

        panelStatusElement = status;
        startButtonElement = startButton;
        stopButtonElement = stopButton;

        header.append(
            title,
            collapseButton
        );

        content.append(
            classField.wrapper,
            subclassField.wrapper,
            skillField.wrapper,
            usageLimitField.wrapper,
            tally.section,
            consecutiveField.wrapper,
            startButton,
            stopButton,
            status
        );

        panel.append(header, content);
        document.body.appendChild(panel);

        const savedClass = GM_getValue(
            STORAGE_KEYS.className,
            'Mage'
        );

        const savedSubclass = GM_getValue(
            STORAGE_KEYS.subclassName,
            'Grand Mage'
        );

        const savedSkill = GM_getValue(
            STORAGE_KEYS.skillName,
            'Slash'
        );

        classField.select.value =
            [
                'Mage',
                'Warrior',
                'Cleric',
                'Hunter'
            ].includes(savedClass)
                ? savedClass
                : 'Mage';

        updateSubclassOptions(
            classField.select,
            subclassField.select,
            savedSubclass
        );

        updateSkillOptions(
            subclassField.select,
            skillField.select,
            savedSkill
        );

        usageLimitField.input.value = String(
            GM_getValue(
                STORAGE_KEYS.usageLimit,
                ''
            ) ?? ''
        );

        consecutiveField.checkbox.checked =
            GM_getValue(
                STORAGE_KEYS.consecutiveBattles,
                false
            );

        classField.select.addEventListener(
            'change',
            () => {
                GM_setValue(
                    STORAGE_KEYS.className,
                    classField.select.value
                );

                updateSubclassOptions(
                    classField.select,
                    subclassField.select
                );

                updateSkillOptions(
                    subclassField.select,
                    skillField.select
                );
            }
        );

        subclassField.select.addEventListener(
            'change',
            () => {
                GM_setValue(
                    STORAGE_KEYS.subclassName,
                    subclassField.select.value
                );

                updateSkillOptions(
                    subclassField.select,
                    skillField.select
                );
            }
        );

        skillField.select.addEventListener(
            'change',
            () => {
                GM_setValue(
                    STORAGE_KEYS.skillName,
                    skillField.select.value
                );

                resetSkillCounts(
                    skillField.select.value
                );

                updateSkillAvailabilityMessage();
            }
        );

        usageLimitField.input.addEventListener(
            'input',
            () => {
                GM_setValue(
                    STORAGE_KEYS.usageLimit,
                    usageLimitField.input.value
                );
            }
        );

        consecutiveField.checkbox.addEventListener(
            'change',
            () => {
                GM_setValue(
                    STORAGE_KEYS.consecutiveBattles,
                    consecutiveField.checkbox.checked
                );
            }
        );

        function setCollapsed(collapsed) {
            panel.classList.toggle(
                'sideg-pvp-collapsed',
                collapsed
            );

            collapseButton.textContent =
                collapsed ? '+' : '−';

            GM_setValue(
                STORAGE_KEYS.collapsed,
                collapsed
            );
        }

        setCollapsed(
            GM_getValue(
                STORAGE_KEYS.collapsed,
                false
            )
        );

        collapseButton.addEventListener(
            'click',
            () => {
                setCollapsed(
                    !panel.classList.contains(
                        'sideg-pvp-collapsed'
                    )
                );
            }
        );

        startButton.addEventListener(
            'click',
            () => {
                const selectedClass =
                    classField.select.value;

                const selectedSubclass =
                    subclassField.select.value;

                const selectedSkill =
                    skillField.select.value;

                const definition =
                    getSkillDefinition(
                        selectedSubclass,
                        selectedSkill
                    );

                if (
                    !definition ||
                    definition.skillId === null ||
                    definition.skillId === undefined
                ) {
                    setStatus(
                        `${selectedSkill || 'This skill'} cannot be automated until its ID is known.`,
                        true
                    );

                    updatePanelButtonState();
                    return;
                }

                GM_setValue(
                    STORAGE_KEYS.className,
                    selectedClass
                );

                GM_setValue(
                    STORAGE_KEYS.subclassName,
                    selectedSubclass
                );

                GM_setValue(
                    STORAGE_KEYS.skillName,
                    selectedSkill
                );

                GM_setValue(
                    STORAGE_KEYS.usageLimit,
                    usageLimitField.input.value
                );

                GM_setValue(
                    STORAGE_KEYS.consecutiveBattles,
                    consecutiveField.checkbox.checked
                );

                resetSkillCounts(selectedSkill);

                clearTokenWaitTimers();

                setAutomationRunning(true);

                actionPending = false;
                fastEnemyModePrepared = false;
                restartPending = false;
                matchmakingPending = false;
                firstBattleAttackPending = true;

                if (isPvPPage()) {
                    setStatus(
                        'Checking Solo PvP tokens...'
                    );

                    beginMatchmaking();
                } else if (isBattlePage()) {
                    setStatus(
                        `Automation started with ${selectedSkill}.`
                    );

                    scheduleBattleCheck(100);
                } else {
                    stopAutomation(
                        'Open the PvP page to begin.',
                        true
                    );
                }
            }
        );

        stopButton.addEventListener(
            'click',
            () => {
                stopAutomation(
                    'Automation paused.'
                );
            }
        );

        updateTallyDisplay();
        updateSkillAvailabilityMessage();
        updatePanelButtonState();
    }

    /*
     * ============================================================
     * Styles
     * ============================================================
     */

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style =
            document.createElement('style');

        style.id = STYLE_ID;

        style.textContent = `
            #${PANEL_ID} {
                position: fixed;
                top: 15px;
                right: 15px;
                width: 300px;
                max-height: calc(100vh - 30px);
                box-sizing: border-box;
                overflow: hidden;
                z-index: 999999;

                color: #ead6a0;

                background:
                    linear-gradient(
                        145deg,
                        rgba(25, 18, 31, 0.98),
                        rgba(12, 10, 18, 0.98)
                    );

                border: 1px solid #80633e;
                border-radius: 10px;

                box-shadow:
                    0 8px 25px rgba(0, 0, 0, 0.65),
                    inset 0 0 20px rgba(120, 80, 40, 0.08);

                font-family:
                    Georgia,
                    "Times New Roman",
                    serif;
            }

            #${PANEL_ID} .sideg-pvp-panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: 42px;
                padding: 0 10px;

                border-bottom:
                    1px solid rgba(128, 99, 62, 0.7);

                background:
                    rgba(0, 0, 0, 0.2);

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

            #${PANEL_ID}.sideg-pvp-collapsed
            .sideg-pvp-panel-content {
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
            #${PANEL_ID} .sideg-pvp-text-input {
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

            #${PANEL_ID} .sideg-pvp-select {
                cursor: pointer;
            }

            #${PANEL_ID} .sideg-pvp-select:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            #${PANEL_ID} .sideg-pvp-text-input::placeholder {
                color: #9f909f;
            }

            #${PANEL_ID} .sideg-pvp-tally-section {
                margin-bottom: 12px;
                padding: 10px;

                background:
                    rgba(0, 0, 0, 0.18);

                border:
                    1px solid rgba(112, 83, 51, 0.7);

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

                background:
                    rgba(189, 137, 54, 0.16);

                border:
                    1px solid rgba(233, 198, 108, 0.3);

                border-radius: 999px;
                text-align: center;
            }

            #${PANEL_ID} .sideg-pvp-checkbox-field {
                display: flex;
                align-items: center;
                gap: 9px;

                margin: 2px 0 13px;
                padding: 9px;

                background:
                    rgba(0, 0, 0, 0.16);

                border:
                    1px solid rgba(112, 83, 51, 0.7);

                border-radius: 7px;
                font-size: 14px;
                font-weight: bold;

                cursor: pointer;
            }

            #${PANEL_ID} .sideg-pvp-checkbox {
                width: 17px;
                height: 17px;
                margin: 0;
                accent-color: #d4a74f;
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

                background:
                    linear-gradient(
                        180deg,
                        #e9c66c,
                        #bd8936
                    );

                border: 1px solid #f0d98e;
            }

            #${PANEL_ID} .sideg-pvp-stop-button {
                margin-top: 8px;

                color: #f9dada;

                background:
                    linear-gradient(
                        180deg,
                        #723333,
                        #4d2020
                    );

                border: 1px solid #a95858;
            }

            #${PANEL_ID} .sideg-pvp-start-button:disabled,
            #${PANEL_ID} .sideg-pvp-stop-button:disabled {
                opacity: 0.45;
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

    /*
     * ============================================================
     * Initialization
     * ============================================================
     */

    injectStyles();
    createControlPanel();

    ensureCountedSkillMatchesSelection();
    updateTallyDisplay();

    if (
        isBattlePage() &&
        isAutomationRunning()
    ) {
        const skill = getSkillDefinition(
            getSelectedSpecialization(),
            getSelectedSkillName()
        );

        if (
            !skill ||
            skill.skillId === null ||
            skill.skillId === undefined
        ) {
            stopAutomation(
                'The selected skill has no known ID.',
                true
            );
        } else {
            actionPending = false;
            fastEnemyModePrepared = false;
            restartPending = false;
            matchmakingPending = false;
            firstBattleAttackPending = true;

            setStatus(
                'Battle automation is active.'
            );

            scheduleBattleCheck(200);
        }
    }

    /*
     * Resume after returning from a completed battle or after the
     * page reloads at the next server-hour boundary.
     */
    if (
        isPvPPage() &&
        isAutomationRunning()
    ) {
        matchmakingPending = false;

        if (hasReachedUsageLimit()) {
            stopAutomation(
                'Selected skill usage limit reached.'
            );
        } else {
            setStatus(
                'Checking Solo PvP tokens...'
            );

            setTimeout(() => {
                if (isAutomationRunning()) {
                    beginMatchmaking();
                }
            }, NEXT_MATCH_DELAY);
        }
    }
})();
