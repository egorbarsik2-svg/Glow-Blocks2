(() => {
  "use strict";

  const BOARD_SIZE = 8;
  const STORAGE_KEY = "glowBlocksSaveV1";
  const CLEAR_DELAY = 330;
  const COIN_MILESTONE_STEP = 10000;
  const COINS_PER_MILESTONE = 500;
  const GOLDEN_BLOCK_REWARD = 100;
  const JULY_EVENT_ID = "july_2026";
  const JULY_EVENT_START = new Date(2026, 6, 1, 0, 0, 0);
  const JULY_EVENT_END = new Date(2026, 7, 1, 0, 0, 0);
  const NEXT_UPDATE_AT = new Date(2026, 6, 1, 0, 0, 0);
  const JULY_EVENT_GOALS = [
    { score: 1000, reward: 100 },
    { score: 3000, reward: 250 },
    { score: 5000, reward: 500 },
    { score: 10000, reward: 1000 }
  ];
  const JULY_EVENT_MAX_GOAL = JULY_EVENT_GOALS[JULY_EVENT_GOALS.length - 1].score;

  const COLORS = [
    "#2dd4bf",
    "#5ee789",
    "#ffd166",
    "#ff6b6b",
    "#a78bfa",
    "#60a5fa",
    "#f472b6",
    "#fb923c"
  ];

  const SHAPES = {
    single: [[0, 0]],
    dominoH: [[0, 0], [1, 0]],
    dominoV: [[0, 0], [0, 1]],
    triH: [[0, 0], [1, 0], [2, 0]],
    triV: [[0, 0], [0, 1], [0, 2]],
    l3: [[0, 0], [0, 1], [1, 1]],
    l3Flip: [[1, 0], [0, 1], [1, 1]],
    square2: [[0, 0], [1, 0], [0, 1], [1, 1]],
    line4H: [[0, 0], [1, 0], [2, 0], [3, 0]],
    line4V: [[0, 0], [0, 1], [0, 2], [0, 3]],
    t4: [[0, 0], [1, 0], [2, 0], [1, 1]],
    t4Down: [[1, 0], [0, 1], [1, 1], [2, 1]],
    s4: [[1, 0], [2, 0], [0, 1], [1, 1]],
    z4: [[0, 0], [1, 0], [1, 1], [2, 1]],
    l4: [[0, 0], [0, 1], [0, 2], [1, 2]],
    l4Flip: [[1, 0], [1, 1], [1, 2], [0, 2]],
    line5H: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
    line5V: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
    plus5: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
    corner5: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
    corner5Flip: [[2, 0], [2, 1], [2, 2], [1, 2], [0, 2]],
    penta: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
    square3: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]]
  };

  const SHAPE_DATA = Object.entries(SHAPES).reduce((map, [id, cells]) => {
    const width = Math.max(...cells.map((cell) => cell[0])) + 1;
    const height = Math.max(...cells.map((cell) => cell[1])) + 1;
    map[id] = { id, cells, width, height };
    return map;
  }, {});

  const DIFFICULTIES = {
    easy: {
      label: "Легкий",
      hint: "Меньше крупных фигур и мягкий темп",
      place: 8,
      line: 180,
      combo: 130,
      pool: ["single", "dominoH", "dominoV", "triH", "triV", "l3", "l3Flip", "square2"]
    },
    normal: {
      label: "Нормальный",
      hint: "Сбалансированные фигуры и очки",
      place: 14,
      line: 240,
      combo: 180,
      pool: [
        "single", "dominoH", "dominoV", "triH", "triV", "l3", "l3Flip", "square2",
        "line4H", "line4V", "t4", "t4Down", "s4", "z4", "l4", "l4Flip", "plus5"
      ]
    },
    hard: {
      label: "Сложный",
      hint: "Крупные фигуры, выше риск и награды",
      place: 18,
      line: 320,
      combo: 240,
      pool: [
        "triH", "triV", "square2", "line4H", "line4V", "t4", "t4Down", "s4", "z4",
        "l4", "l4Flip", "line5H", "line5V", "plus5", "corner5", "corner5Flip", "penta", "square3"
      ]
    }
  };

  const ACHIEVEMENTS = [
    { id: "first_block", icon: "1", title: "Первый ход", detail: "Разместите 1 фигуру", test: (save) => save.totalBlocksPlaced >= 1 },
    { id: "block_50", icon: "50", title: "Твердая рука", detail: "Разместите 50 фигур", test: (save) => save.totalBlocksPlaced >= 50 },
    { id: "line_10", icon: "10", title: "Ломатель линий", detail: "Очистите 10 линий", test: (save) => save.totalLinesCleared >= 10 },
    { id: "line_100", icon: "100", title: "Мастер сетки", detail: "Очистите 100 линий", test: (save) => save.totalLinesCleared >= 100 },
    { id: "score_1000", icon: "1K", title: "Неоновый рывок", detail: "Наберите рекорд 1 000", test: (save) => save.highScore >= 1000 },
    { id: "score_5000", icon: "5K", title: "Неоновая легенда", detail: "Наберите рекорд 5 000", test: (save) => save.highScore >= 5000 },
    { id: "combo_3", icon: "3x", title: "Тройная очистка", detail: "Очистите 3 линии за ход", test: (save) => save.bestCombo >= 3 },
    { id: "daily_3", icon: "D3", title: "Ежедневная искра", detail: "Соберите серию 3 дня", test: (save) => save.dailyStreak >= 3 },
    { id: "games_10", icon: "10G", title: "Постоянный игрок", detail: "Сыграйте 10 игр", test: (save) => save.gamesPlayed >= 10 }
  ];

  const LANGUAGES = [
    { code: "ru", name: "Русский", locale: "ru-RU" },
    { code: "en", name: "English", locale: "en-US" },
    { code: "es", name: "Español", locale: "es-ES" },
    { code: "fr", name: "Français", locale: "fr-FR" },
    { code: "pt", name: "Português", locale: "pt-BR" },
    { code: "de", name: "Deutsch", locale: "de-DE" },
    { code: "it", name: "Italiano", locale: "it-IT" },
    { code: "uk", name: "Українська", locale: "uk-UA" }
  ];

  const BLOCK_MATERIALS = [
    { id: "neon", price: 0, preview: "#2dd4bf" },
    { id: "glass", price: 500, preview: "#d9faff" },
    { id: "metal", price: 1000, preview: "#a1a1aa" },
    { id: "crystal", price: 1500, preview: "#a78bfa" },
    { id: "magma", price: 2000, preview: "#fb923c" },
    { id: "galaxy", price: 3000, preview: "#6366f1" }
  ];

  const I18N = {
    ru: {
      "app.title": "Glow Blocks - офлайн игра",
      "top.menu": "Меню",
      "top.pause": "Пауза",
      "top.resume": "Продолжить",
      "top.restart": "Заново",
      "top.soundOn": "Звук",
      "top.soundOff": "Без звука",
      "score.current": "Счет",
      "score.best": "Рекорд",
      "score.mode": "Режим",
      "score.coins": "Монеты",
      "score.piece": "Фигура",
      "score.bonus": "Бонус",
      "score.row": "Строка",
      "score.column": "Столбец",
      "score.combo": "Комбо x{count}",
      "common.close": "Закрыть",
      "common.mainMenu": "Главное меню",
      "board.stageLabel": "Игровое поле",
      "board.gridLabel": "Игровое поле 8 на 8",
      "board.pieceDockLabel": "Доступные фигуры",
      "menu.eyebrow": "Офлайн головоломка",
      "menu.best": "Рекорд",
      "menu.streak": "Серия",
      "menu.play": "Играть",
      "menu.dailyReady": "Ежедневная награда",
      "menu.dailyClaimed": "Награда получена",
      "menu.achievements": "Достижения",
      "menu.stats": "Статистика",
      "menu.updates": "Обновления",
      "menu.event": "Событие июля",
      "menu.eventReady": "Событие: награда готова",
      "menu.shop": "Магазин",
      "menu.settings": "Настройки",
      "pause.eyebrow": "Пауза",
      "pause.title": "Передышка",
      "pause.resume": "Продолжить",
      "gameOver.eyebrow": "Конец игры",
      "gameOver.lines": "Линии",
      "updates.eyebrow": "Обновления",
      "updates.title": "Следующее обновление",
      "updates.close": "Закрыть обновления",
      "updates.statusSoon": "Следующее обновление скоро",
      "updates.statusReleased": "Обновление уже вышло",
      "updates.timerSoon": "Осталось {time}",
      "updates.timerReleased": "Вышло 1 июля 2026",
      "updates.dateLabel": "Дата",
      "updates.dateValue": "1 июля 2026",
      "updates.noteLabel": "Что будет",
      "updates.note": "Июльское событие, золотой блок на 100 монет, награды и улучшенный баланс очков.",
      "event.eyebrow": "Событие июля",
      "event.title": "Июльский рывок",
      "event.close": "Закрыть событие",
      "event.goalTitle": "Цели события",
      "event.progressTitle": "Общий прогресс",
      "event.goalText": "Набирайте очки с 1 июля до 1 августа и забирайте монеты за каждую цель.",
      "event.statusSoon": "Начнется 1 июля",
      "event.statusActive": "Идет событие",
      "event.statusEnded": "Событие завершено",
      "event.timerStarts": "До начала {time}",
      "event.timerEnds": "До конца {time}",
      "event.timerEnded": "Завершилось 1 августа",
      "event.claimAll": "Забрать доступные награды",
      "event.noRewards": "Нет доступных наград",
      "event.claim": "Забрать",
      "event.claimed": "Получено",
      "event.locked": "Нужно {score}",
      "event.reward": "+{amount} монет",
      "event.goalReached": "Цель {score} очков достигнута",
      "event.rewardToast": "+{amount} монет за событие",
      "shop.eyebrow": "Магазин",
      "shop.title": "Материалы блоков",
      "shop.close": "Закрыть магазин",
      "settings.eyebrow": "Настройки",
      "settings.title": "Параметры игры",
      "settings.close": "Закрыть настройки",
      "settings.difficulty": "Сложность",
      "settings.language": "Язык",
      "settings.languageHint": "Русский язык по умолчанию",
      "settings.sound": "Звук",
      "settings.soundOnHint": "Эффекты включены",
      "settings.soundOffHint": "Эффекты выключены",
      "settings.materials": "Материал блоков",
      "settings.materialHint": "500 монет за каждые 10 000 очков. Новый купленный материал сразу заменяет активный стиль.",
      "wallet.balance": "Баланс",
      "material.status.selected": "Выбрано",
      "material.status.owned": "Выбрать",
      "material.status.buy": "Купить и выбрать {price}",
      "material.status.need": "Нужно {price}",
      "toast.coins": "Монеты",
      "toast.coinsEarned": "+{amount} монет за {score} очков",
      "toast.goldenBlock": "Золотой блок",
      "toast.goldenBlockReward": "+{amount} монет за июльский бонус",
      "toast.materialBought": "Материал куплен и выбран",
      "toast.materialSelected": "Материал выбран",
      "toast.notEnoughCoins": "Не хватает монет",
      "material.neon.name": "Неон",
      "material.neon.detail": "Классическое яркое свечение",
      "material.glass.name": "Стекло",
      "material.glass.detail": "Полупрозрачные блоки с бликами",
      "material.metal.name": "Металл",
      "material.metal.detail": "Холодный блеск и тяжелая фактура",
      "material.crystal.name": "Кристалл",
      "material.crystal.detail": "Острые грани и сияние",
      "material.magma.name": "Магма",
      "material.magma.detail": "Горячая лава и огненные трещины",
      "material.galaxy.name": "Галактика",
      "material.galaxy.detail": "Темный космос со звездным свечением",
      "difficulty.easy.label": "Легкий",
      "difficulty.easy.hint": "Меньше крупных фигур и мягкий темп",
      "difficulty.normal.label": "Нормальный",
      "difficulty.normal.hint": "Сбалансированные фигуры и очки",
      "difficulty.hard.label": "Сложный",
      "difficulty.hard.hint": "Крупные фигуры, выше риск и награды",
      "stats.eyebrow": "Статистика",
      "stats.title": "Ваш прогресс",
      "stats.close": "Закрыть статистику",
      "stats.highScore": "Лучший счет",
      "stats.gamesPlayed": "Сыграно игр",
      "stats.blocksPlaced": "Всего размещено блоков",
      "stats.linesCleared": "Всего очищено линий",
      "achievements.eyebrow": "Достижения",
      "achievements.title": "Награды",
      "achievements.close": "Закрыть достижения",
      "achievements.unlocked": "Открыто {date}",
      "daily.eyebrow": "Ежедневная награда",
      "daily.ready": "Бонус готов",
      "daily.claimed": "Сегодня получено",
      "daily.boost": "бонус к счету",
      "daily.streak": "Серия",
      "daily.banked": "В запасе",
      "daily.claim": "Забрать",
      "daily.claimedButton": "Получено",
      "status.ready": "Готово",
      "status.newGame": "Новая игра",
      "status.paused": "Пауза",
      "status.go": "Вперед",
      "status.blocksReady": "Фигуры готовы",
      "status.gameOver": "Конец игры",
      "status.dailyBonus": "Ежедневный бонус",
      "toast.difficulty": "Сложность",
      "toast.language": "Язык",
      "toast.achievement": "Достижение",
      "toast.dailyReward": "Ежедневная награда",
      "toast.dailyBanked": "+{amount} в запасе",
      "toast.event": "Событие июля",
      "achievement.first_block.title": "Первый ход",
      "achievement.first_block.detail": "Разместите 1 фигуру",
      "achievement.block_50.title": "Твердая рука",
      "achievement.block_50.detail": "Разместите 50 фигур",
      "achievement.line_10.title": "Ломатель линий",
      "achievement.line_10.detail": "Очистите 10 линий",
      "achievement.line_100.title": "Мастер сетки",
      "achievement.line_100.detail": "Очистите 100 линий",
      "achievement.score_1000.title": "Неоновый рывок",
      "achievement.score_1000.detail": "Наберите рекорд 1 000",
      "achievement.score_5000.title": "Неоновая легенда",
      "achievement.score_5000.detail": "Наберите рекорд 5 000",
      "achievement.combo_3.title": "Тройная очистка",
      "achievement.combo_3.detail": "Очистите 3 линии за ход",
      "achievement.daily_3.title": "Ежедневная искра",
      "achievement.daily_3.detail": "Соберите серию 3 дня",
      "achievement.games_10.title": "Постоянный игрок",
      "achievement.games_10.detail": "Сыграйте 10 игр"
    },
    en: {
      "app.title": "Glow Blocks - offline game",
      "top.menu": "Menu",
      "top.pause": "Pause",
      "top.resume": "Resume",
      "top.restart": "Restart",
      "top.soundOn": "Sound",
      "top.soundOff": "Muted",
      "score.current": "Score",
      "score.best": "Best",
      "score.mode": "Mode",
      "score.coins": "Coins",
      "score.piece": "Piece",
      "score.bonus": "Bonus",
      "score.row": "Row",
      "score.column": "Column",
      "score.combo": "Combo x{count}",
      "common.close": "Close",
      "common.mainMenu": "Main Menu",
      "board.stageLabel": "Game board",
      "board.gridLabel": "8 by 8 game board",
      "board.pieceDockLabel": "Available pieces",
      "menu.eyebrow": "Offline puzzle",
      "menu.best": "Best",
      "menu.streak": "Streak",
      "menu.play": "Play",
      "menu.dailyReady": "Daily Reward",
      "menu.dailyClaimed": "Daily Claimed",
      "menu.achievements": "Achievements",
      "menu.stats": "Statistics",
      "menu.updates": "Updates",
      "menu.event": "July Event",
      "menu.eventReady": "Event: reward ready",
      "menu.shop": "Shop",
      "menu.settings": "Settings",
      "pause.eyebrow": "Paused",
      "pause.title": "Take Five",
      "pause.resume": "Resume",
      "gameOver.eyebrow": "Game Over",
      "gameOver.lines": "Lines",
      "updates.eyebrow": "Updates",
      "updates.title": "Next update",
      "updates.close": "Close updates",
      "updates.statusSoon": "Next update is coming",
      "updates.statusReleased": "Update is live",
      "updates.timerSoon": "{time} left",
      "updates.timerReleased": "Released on July 1, 2026",
      "updates.dateLabel": "Date",
      "updates.dateValue": "July 1, 2026",
      "updates.noteLabel": "What is coming",
      "updates.note": "July event, a golden block worth 100 coins, rewards, and improved score balance.",
      "event.eyebrow": "July Event",
      "event.title": "July Rush",
      "event.close": "Close event",
      "event.goalTitle": "Event goals",
      "event.progressTitle": "Total progress",
      "event.goalText": "Score points from July 1 to August 1 and claim coins for each goal.",
      "event.statusSoon": "Starts July 1",
      "event.statusActive": "Event active",
      "event.statusEnded": "Event ended",
      "event.timerStarts": "Starts in {time}",
      "event.timerEnds": "Ends in {time}",
      "event.timerEnded": "Ended on August 1",
      "event.claimAll": "Claim available rewards",
      "event.noRewards": "No rewards ready",
      "event.claim": "Claim",
      "event.claimed": "Claimed",
      "event.locked": "Need {score}",
      "event.reward": "+{amount} coins",
      "event.goalReached": "{score} score goal reached",
      "event.rewardToast": "+{amount} event coins",
      "shop.eyebrow": "Shop",
      "shop.title": "Block materials",
      "shop.close": "Close shop",
      "settings.eyebrow": "Settings",
      "settings.title": "Game Setup",
      "settings.close": "Close settings",
      "settings.difficulty": "Difficulty",
      "settings.language": "Language",
      "settings.languageHint": "Russian is the default language",
      "settings.sound": "Sound",
      "settings.soundOnHint": "Effects enabled",
      "settings.soundOffHint": "Effects muted",
      "settings.materials": "Block material",
      "settings.materialHint": "Earn 500 coins for every 10,000 score. A newly bought material immediately replaces the active style.",
      "wallet.balance": "Balance",
      "material.status.selected": "Selected",
      "material.status.owned": "Select",
      "material.status.buy": "Buy and select {price}",
      "material.status.need": "Need {price}",
      "toast.coins": "Coins",
      "toast.coinsEarned": "+{amount} coins for {score} score",
      "toast.goldenBlock": "Golden block",
      "toast.goldenBlockReward": "+{amount} coins for the July bonus",
      "toast.materialBought": "Material bought and selected",
      "toast.materialSelected": "Material selected",
      "toast.notEnoughCoins": "Not enough coins",
      "material.neon.name": "Neon",
      "material.neon.detail": "Classic bright glow",
      "material.glass.name": "Glass",
      "material.glass.detail": "Translucent blocks with highlights",
      "material.metal.name": "Metal",
      "material.metal.detail": "Cool shine and heavy texture",
      "material.crystal.name": "Crystal",
      "material.crystal.detail": "Sharp facets and sparkle",
      "material.magma.name": "Magma",
      "material.magma.detail": "Hot lava and fiery cracks",
      "material.galaxy.name": "Galaxy",
      "material.galaxy.detail": "Dark space with starry glow",
      "difficulty.easy.label": "Easy",
      "difficulty.easy.hint": "Smaller pieces and a gentler pace",
      "difficulty.normal.label": "Normal",
      "difficulty.normal.hint": "Balanced pieces and scoring",
      "difficulty.hard.label": "Hard",
      "difficulty.hard.hint": "Larger pieces, higher risk and rewards",
      "stats.eyebrow": "Statistics",
      "stats.title": "Your Progress",
      "stats.close": "Close statistics",
      "stats.highScore": "Best score",
      "stats.gamesPlayed": "Games played",
      "stats.blocksPlaced": "Total pieces placed",
      "stats.linesCleared": "Total lines cleared",
      "achievements.eyebrow": "Achievements",
      "achievements.title": "Milestones",
      "achievements.close": "Close achievements",
      "achievements.unlocked": "Unlocked {date}",
      "daily.eyebrow": "Daily Reward",
      "daily.ready": "Bonus Ready",
      "daily.claimed": "Claimed Today",
      "daily.boost": "score boost",
      "daily.streak": "Streak",
      "daily.banked": "Banked",
      "daily.claim": "Claim",
      "daily.claimedButton": "Claimed",
      "status.ready": "Ready",
      "status.newGame": "New Game",
      "status.paused": "Paused",
      "status.go": "Go",
      "status.blocksReady": "Pieces Ready",
      "status.gameOver": "Game Over",
      "status.dailyBonus": "Daily Bonus",
      "toast.difficulty": "Difficulty",
      "toast.language": "Language",
      "toast.achievement": "Achievement",
      "toast.dailyReward": "Daily Reward",
      "toast.dailyBanked": "+{amount} banked",
      "toast.event": "July Event",
      "achievement.first_block.title": "First Drop",
      "achievement.first_block.detail": "Place 1 piece",
      "achievement.block_50.title": "Steady Hands",
      "achievement.block_50.detail": "Place 50 pieces",
      "achievement.line_10.title": "Line Breaker",
      "achievement.line_10.detail": "Clear 10 lines",
      "achievement.line_100.title": "Grid Master",
      "achievement.line_100.detail": "Clear 100 lines",
      "achievement.score_1000.title": "Glow Run",
      "achievement.score_1000.detail": "Reach a 1,000 best score",
      "achievement.score_5000.title": "Neon Legend",
      "achievement.score_5000.detail": "Reach a 5,000 best score",
      "achievement.combo_3.title": "Triple Clear",
      "achievement.combo_3.detail": "Clear 3 lines at once",
      "achievement.daily_3.title": "Daily Spark",
      "achievement.daily_3.detail": "Build a 3 day streak",
      "achievement.games_10.title": "Regular",
      "achievement.games_10.detail": "Play 10 games"
    },
    es: {
      "app.title": "Glow Blocks - juego sin conexión",
      "top.menu": "Menú",
      "top.pause": "Pausa",
      "top.resume": "Continuar",
      "top.restart": "Reiniciar",
      "top.soundOn": "Sonido",
      "top.soundOff": "Silencio",
      "score.current": "Puntos",
      "score.best": "Récord",
      "score.mode": "Modo",
      "score.coins": "Monedas",
      "score.piece": "Pieza",
      "score.bonus": "Bono",
      "score.row": "Fila",
      "score.column": "Columna",
      "score.combo": "Combo x{count}",
      "common.close": "Cerrar",
      "common.mainMenu": "Menú principal",
      "board.stageLabel": "Tablero de juego",
      "board.gridLabel": "Tablero 8 por 8",
      "board.pieceDockLabel": "Piezas disponibles",
      "menu.eyebrow": "Puzzle sin conexión",
      "menu.best": "Récord",
      "menu.streak": "Racha",
      "menu.play": "Jugar",
      "menu.dailyReady": "Recompensa diaria",
      "menu.dailyClaimed": "Recompensa recibida",
      "menu.achievements": "Logros",
      "menu.stats": "Estadísticas",
      "menu.updates": "Actualizaciones",
      "menu.event": "Evento de julio",
      "menu.eventReady": "Evento: recompensa lista",
      "menu.shop": "Tienda",
      "menu.settings": "Ajustes",
      "pause.eyebrow": "Pausa",
      "pause.title": "Descanso",
      "pause.resume": "Continuar",
      "gameOver.eyebrow": "Fin del juego",
      "gameOver.lines": "Líneas",
      "updates.eyebrow": "Actualizaciones",
      "updates.title": "Próxima actualización",
      "updates.close": "Cerrar actualizaciones",
      "updates.statusSoon": "La próxima actualización llega pronto",
      "updates.statusReleased": "La actualización ya está disponible",
      "updates.timerSoon": "Faltan {time}",
      "updates.timerReleased": "Disponible el 1 de julio de 2026",
      "updates.dateLabel": "Fecha",
      "updates.dateValue": "1 de julio de 2026",
      "updates.noteLabel": "Qué llega",
      "updates.note": "Evento de julio, bloque dorado de 100 monedas, recompensas y mejor balance de puntos.",
      "event.eyebrow": "Evento de julio",
      "event.title": "Impulso de julio",
      "event.close": "Cerrar evento",
      "event.goalTitle": "Objetivos del evento",
      "event.progressTitle": "Progreso total",
      "event.goalText": "Consigue puntos del 1 de julio al 1 de agosto y recibe monedas por cada objetivo.",
      "event.statusSoon": "Empieza el 1 de julio",
      "event.statusActive": "Evento activo",
      "event.statusEnded": "Evento terminado",
      "event.timerStarts": "Empieza en {time}",
      "event.timerEnds": "Termina en {time}",
      "event.timerEnded": "Terminó el 1 de agosto",
      "event.claimAll": "Recibir recompensas listas",
      "event.noRewards": "No hay recompensas listas",
      "event.claim": "Recibir",
      "event.claimed": "Recibido",
      "event.locked": "Faltan {score}",
      "event.reward": "+{amount} monedas",
      "event.goalReached": "Objetivo de {score} puntos alcanzado",
      "event.rewardToast": "+{amount} monedas del evento",
      "shop.eyebrow": "Tienda",
      "shop.title": "Materiales de bloques",
      "shop.close": "Cerrar tienda",
      "settings.eyebrow": "Ajustes",
      "settings.title": "Configuración",
      "settings.close": "Cerrar ajustes",
      "settings.difficulty": "Dificultad",
      "settings.language": "Idioma",
      "settings.languageHint": "El ruso es el idioma predeterminado",
      "settings.sound": "Sonido",
      "settings.soundOnHint": "Efectos activados",
      "settings.soundOffHint": "Efectos desactivados",
      "settings.materials": "Material de bloques",
      "settings.materialHint": "Gana 500 monedas por cada 10.000 puntos. Un material nuevo reemplaza al estilo activo.",
      "wallet.balance": "Saldo",
      "material.status.selected": "Seleccionado",
      "material.status.owned": "Elegir",
      "material.status.buy": "Comprar y elegir {price}",
      "material.status.need": "Faltan {price}",
      "toast.coins": "Monedas",
      "toast.coinsEarned": "+{amount} monedas por {score} puntos",
      "toast.goldenBlock": "Bloque dorado",
      "toast.goldenBlockReward": "+{amount} monedas por el bono de julio",
      "toast.materialBought": "Material comprado y elegido",
      "toast.materialSelected": "Material seleccionado",
      "toast.notEnoughCoins": "No hay suficientes monedas",
      "material.neon.name": "Neón",
      "material.neon.detail": "Brillo clásico intenso",
      "material.glass.name": "Vidrio",
      "material.glass.detail": "Bloques translúcidos con reflejos",
      "material.metal.name": "Metal",
      "material.metal.detail": "Brillo frío y textura pesada",
      "material.crystal.name": "Cristal",
      "material.crystal.detail": "Facetas marcadas y destellos",
      "material.magma.name": "Magma",
      "material.magma.detail": "Lava caliente y grietas ardientes",
      "material.galaxy.name": "Galaxia",
      "material.galaxy.detail": "Espacio oscuro con brillo estelar",
      "difficulty.easy.label": "Fácil",
      "difficulty.easy.hint": "Piezas más pequeñas y ritmo suave",
      "difficulty.normal.label": "Normal",
      "difficulty.normal.hint": "Piezas y puntuación equilibradas",
      "difficulty.hard.label": "Difícil",
      "difficulty.hard.hint": "Piezas grandes, más riesgo y recompensa",
      "stats.eyebrow": "Estadísticas",
      "stats.title": "Tu progreso",
      "stats.close": "Cerrar estadísticas",
      "stats.highScore": "Mejor puntuación",
      "stats.gamesPlayed": "Partidas jugadas",
      "stats.blocksPlaced": "Piezas colocadas",
      "stats.linesCleared": "Líneas eliminadas",
      "achievements.eyebrow": "Logros",
      "achievements.title": "Metas",
      "achievements.close": "Cerrar logros",
      "achievements.unlocked": "Desbloqueado {date}",
      "daily.eyebrow": "Recompensa diaria",
      "daily.ready": "Bono listo",
      "daily.claimed": "Recibido hoy",
      "daily.boost": "bono de puntos",
      "daily.streak": "Racha",
      "daily.banked": "Guardado",
      "daily.claim": "Recibir",
      "daily.claimedButton": "Recibido",
      "status.ready": "Listo",
      "status.newGame": "Nueva partida",
      "status.paused": "Pausa",
      "status.go": "Vamos",
      "status.blocksReady": "Piezas listas",
      "status.gameOver": "Fin del juego",
      "status.dailyBonus": "Bono diario",
      "toast.difficulty": "Dificultad",
      "toast.language": "Idioma",
      "toast.achievement": "Logro",
      "toast.dailyReward": "Recompensa diaria",
      "toast.dailyBanked": "+{amount} guardado",
      "toast.event": "Evento de julio",
      "achievement.first_block.title": "Primera caída",
      "achievement.first_block.detail": "Coloca 1 pieza",
      "achievement.block_50.title": "Manos firmes",
      "achievement.block_50.detail": "Coloca 50 piezas",
      "achievement.line_10.title": "Rompe líneas",
      "achievement.line_10.detail": "Elimina 10 líneas",
      "achievement.line_100.title": "Maestro de la cuadrícula",
      "achievement.line_100.detail": "Elimina 100 líneas",
      "achievement.score_1000.title": "Carrera brillante",
      "achievement.score_1000.detail": "Alcanza un récord de 1.000",
      "achievement.score_5000.title": "Leyenda neón",
      "achievement.score_5000.detail": "Alcanza un récord de 5.000",
      "achievement.combo_3.title": "Triple limpieza",
      "achievement.combo_3.detail": "Elimina 3 líneas a la vez",
      "achievement.daily_3.title": "Chispa diaria",
      "achievement.daily_3.detail": "Consigue una racha de 3 días",
      "achievement.games_10.title": "Constante",
      "achievement.games_10.detail": "Juega 10 partidas"
    },
    fr: {
      "app.title": "Glow Blocks - jeu hors ligne",
      "top.menu": "Menu",
      "top.pause": "Pause",
      "top.resume": "Reprendre",
      "top.restart": "Recommencer",
      "top.soundOn": "Son",
      "top.soundOff": "Muet",
      "score.current": "Score",
      "score.best": "Record",
      "score.mode": "Mode",
      "score.coins": "Pièces",
      "score.piece": "Pièce",
      "score.bonus": "Bonus",
      "score.row": "Ligne",
      "score.column": "Colonne",
      "score.combo": "Combo x{count}",
      "common.close": "Fermer",
      "common.mainMenu": "Menu principal",
      "board.stageLabel": "Plateau de jeu",
      "board.gridLabel": "Plateau 8 par 8",
      "board.pieceDockLabel": "Pièces disponibles",
      "menu.eyebrow": "Puzzle hors ligne",
      "menu.best": "Record",
      "menu.streak": "Série",
      "menu.play": "Jouer",
      "menu.dailyReady": "Récompense quotidienne",
      "menu.dailyClaimed": "Récompense obtenue",
      "menu.achievements": "Succès",
      "menu.stats": "Statistiques",
      "menu.updates": "Mises à jour",
      "menu.event": "Événement de juillet",
      "menu.eventReady": "Événement : récompense prête",
      "menu.shop": "Boutique",
      "menu.settings": "Réglages",
      "pause.eyebrow": "Pause",
      "pause.title": "Petite pause",
      "pause.resume": "Reprendre",
      "gameOver.eyebrow": "Fin de partie",
      "gameOver.lines": "Lignes",
      "updates.eyebrow": "Mises à jour",
      "updates.title": "Prochaine mise à jour",
      "updates.close": "Fermer les mises à jour",
      "updates.statusSoon": "La prochaine mise à jour arrive bientôt",
      "updates.statusReleased": "La mise à jour est disponible",
      "updates.timerSoon": "Reste {time}",
      "updates.timerReleased": "Disponible le 1er juillet 2026",
      "updates.dateLabel": "Date",
      "updates.dateValue": "1er juillet 2026",
      "updates.noteLabel": "À venir",
      "updates.note": "Événement de juillet, bloc doré de 100 pièces, récompenses et meilleur équilibre des points.",
      "event.eyebrow": "Événement de juillet",
      "event.title": "Rush de juillet",
      "event.close": "Fermer l'événement",
      "event.goalTitle": "Objectifs de l'événement",
      "event.progressTitle": "Progression totale",
      "event.goalText": "Marquez des points du 1er juillet au 1er août et obtenez des pièces pour chaque objectif.",
      "event.statusSoon": "Commence le 1er juillet",
      "event.statusActive": "Événement actif",
      "event.statusEnded": "Événement terminé",
      "event.timerStarts": "Début dans {time}",
      "event.timerEnds": "Fin dans {time}",
      "event.timerEnded": "Terminé le 1er août",
      "event.claimAll": "Recevoir les récompenses prêtes",
      "event.noRewards": "Aucune récompense prête",
      "event.claim": "Recevoir",
      "event.claimed": "Reçu",
      "event.locked": "Il faut {score}",
      "event.reward": "+{amount} pièces",
      "event.goalReached": "Objectif de {score} points atteint",
      "event.rewardToast": "+{amount} pièces d'événement",
      "shop.eyebrow": "Boutique",
      "shop.title": "Matériaux des blocs",
      "shop.close": "Fermer la boutique",
      "settings.eyebrow": "Réglages",
      "settings.title": "Configuration",
      "settings.close": "Fermer les réglages",
      "settings.difficulty": "Difficulté",
      "settings.language": "Langue",
      "settings.languageHint": "Le russe est la langue par défaut",
      "settings.sound": "Son",
      "settings.soundOnHint": "Effets activés",
      "settings.soundOffHint": "Effets coupés",
      "settings.materials": "Matériau des blocs",
      "settings.materialHint": "Gagnez 500 pièces tous les 10 000 points. Un nouveau matériau remplace le style actif.",
      "wallet.balance": "Solde",
      "material.status.selected": "Sélectionné",
      "material.status.owned": "Choisir",
      "material.status.buy": "Acheter et choisir {price}",
      "material.status.need": "Manque {price}",
      "toast.coins": "Pièces",
      "toast.coinsEarned": "+{amount} pièces pour {score} points",
      "toast.goldenBlock": "Bloc doré",
      "toast.goldenBlockReward": "+{amount} pièces pour le bonus de juillet",
      "toast.materialBought": "Matériau acheté et sélectionné",
      "toast.materialSelected": "Matériau sélectionné",
      "toast.notEnoughCoins": "Pas assez de pièces",
      "material.neon.name": "Néon",
      "material.neon.detail": "Éclat lumineux classique",
      "material.glass.name": "Verre",
      "material.glass.detail": "Blocs translucides avec reflets",
      "material.metal.name": "Métal",
      "material.metal.detail": "Brillance froide et texture lourde",
      "material.crystal.name": "Cristal",
      "material.crystal.detail": "Facettes nettes et scintillement",
      "material.magma.name": "Magma",
      "material.magma.detail": "Lave chaude et fissures de feu",
      "material.galaxy.name": "Galaxie",
      "material.galaxy.detail": "Espace sombre avec éclat étoilé",
      "difficulty.easy.label": "Facile",
      "difficulty.easy.hint": "Pièces plus petites et rythme doux",
      "difficulty.normal.label": "Normal",
      "difficulty.normal.hint": "Pièces et score équilibrés",
      "difficulty.hard.label": "Difficile",
      "difficulty.hard.hint": "Grosses pièces, plus de risque et de récompenses",
      "stats.eyebrow": "Statistiques",
      "stats.title": "Votre progression",
      "stats.close": "Fermer les statistiques",
      "stats.highScore": "Meilleur score",
      "stats.gamesPlayed": "Parties jouées",
      "stats.blocksPlaced": "Pièces placées",
      "stats.linesCleared": "Lignes effacées",
      "achievements.eyebrow": "Succès",
      "achievements.title": "Objectifs",
      "achievements.close": "Fermer les succès",
      "achievements.unlocked": "Débloqué {date}",
      "daily.eyebrow": "Récompense quotidienne",
      "daily.ready": "Bonus prêt",
      "daily.claimed": "Déjà reçu",
      "daily.boost": "bonus de score",
      "daily.streak": "Série",
      "daily.banked": "En réserve",
      "daily.claim": "Recevoir",
      "daily.claimedButton": "Reçu",
      "status.ready": "Prêt",
      "status.newGame": "Nouvelle partie",
      "status.paused": "Pause",
      "status.go": "C'est parti",
      "status.blocksReady": "Pièces prêtes",
      "status.gameOver": "Fin de partie",
      "status.dailyBonus": "Bonus quotidien",
      "toast.difficulty": "Difficulté",
      "toast.language": "Langue",
      "toast.achievement": "Succès",
      "toast.dailyReward": "Récompense quotidienne",
      "toast.dailyBanked": "+{amount} en réserve",
      "toast.event": "Événement de juillet",
      "achievement.first_block.title": "Premier placement",
      "achievement.first_block.detail": "Placez 1 pièce",
      "achievement.block_50.title": "Main sûre",
      "achievement.block_50.detail": "Placez 50 pièces",
      "achievement.line_10.title": "Briseur de lignes",
      "achievement.line_10.detail": "Effacez 10 lignes",
      "achievement.line_100.title": "Maître de la grille",
      "achievement.line_100.detail": "Effacez 100 lignes",
      "achievement.score_1000.title": "Course lumineuse",
      "achievement.score_1000.detail": "Atteignez un record de 1 000",
      "achievement.score_5000.title": "Légende néon",
      "achievement.score_5000.detail": "Atteignez un record de 5 000",
      "achievement.combo_3.title": "Triple effacement",
      "achievement.combo_3.detail": "Effacez 3 lignes d'un coup",
      "achievement.daily_3.title": "Étincelle quotidienne",
      "achievement.daily_3.detail": "Obtenez une série de 3 jours",
      "achievement.games_10.title": "Habitué",
      "achievement.games_10.detail": "Jouez 10 parties"
    },
    pt: {
      "app.title": "Glow Blocks - jogo offline",
      "top.menu": "Menu",
      "top.pause": "Pausar",
      "top.resume": "Continuar",
      "top.restart": "Reiniciar",
      "top.soundOn": "Som",
      "top.soundOff": "Mudo",
      "score.current": "Pontos",
      "score.best": "Recorde",
      "score.mode": "Modo",
      "score.coins": "Moedas",
      "score.piece": "Peça",
      "score.bonus": "Bônus",
      "score.row": "Linha",
      "score.column": "Coluna",
      "score.combo": "Combo x{count}",
      "common.close": "Fechar",
      "common.mainMenu": "Menu principal",
      "board.stageLabel": "Tabuleiro",
      "board.gridLabel": "Tabuleiro 8 por 8",
      "board.pieceDockLabel": "Peças disponíveis",
      "menu.eyebrow": "Quebra-cabeça offline",
      "menu.best": "Recorde",
      "menu.streak": "Sequência",
      "menu.play": "Jogar",
      "menu.dailyReady": "Recompensa diária",
      "menu.dailyClaimed": "Recompensa recebida",
      "menu.achievements": "Conquistas",
      "menu.stats": "Estatísticas",
      "menu.updates": "Atualizações",
      "menu.event": "Evento de julho",
      "menu.eventReady": "Evento: recompensa pronta",
      "menu.shop": "Loja",
      "menu.settings": "Configurações",
      "pause.eyebrow": "Pausado",
      "pause.title": "Pausa rápida",
      "pause.resume": "Continuar",
      "gameOver.eyebrow": "Fim de jogo",
      "gameOver.lines": "Linhas",
      "updates.eyebrow": "Atualizações",
      "updates.title": "Próxima atualização",
      "updates.close": "Fechar atualizações",
      "updates.statusSoon": "A próxima atualização chega em breve",
      "updates.statusReleased": "A atualização já está disponível",
      "updates.timerSoon": "Faltam {time}",
      "updates.timerReleased": "Disponível em 1 de julho de 2026",
      "updates.dateLabel": "Data",
      "updates.dateValue": "1 de julho de 2026",
      "updates.noteLabel": "O que vem",
      "updates.note": "Evento de julho, bloco dourado de 100 moedas, recompensas e melhor equilíbrio de pontos.",
      "event.eyebrow": "Evento de julho",
      "event.title": "Arrancada de julho",
      "event.close": "Fechar evento",
      "event.goalTitle": "Metas do evento",
      "event.progressTitle": "Progresso total",
      "event.goalText": "Faça pontos de 1 de julho a 1 de agosto e receba moedas por cada meta.",
      "event.statusSoon": "Começa em 1 de julho",
      "event.statusActive": "Evento ativo",
      "event.statusEnded": "Evento encerrado",
      "event.timerStarts": "Começa em {time}",
      "event.timerEnds": "Termina em {time}",
      "event.timerEnded": "Terminou em 1 de agosto",
      "event.claimAll": "Receber recompensas prontas",
      "event.noRewards": "Nenhuma recompensa pronta",
      "event.claim": "Receber",
      "event.claimed": "Recebido",
      "event.locked": "Faltam {score}",
      "event.reward": "+{amount} moedas",
      "event.goalReached": "Meta de {score} pontos alcançada",
      "event.rewardToast": "+{amount} moedas do evento",
      "shop.eyebrow": "Loja",
      "shop.title": "Materiais dos blocos",
      "shop.close": "Fechar loja",
      "settings.eyebrow": "Configurações",
      "settings.title": "Configuração do jogo",
      "settings.close": "Fechar configurações",
      "settings.difficulty": "Dificuldade",
      "settings.language": "Idioma",
      "settings.languageHint": "Russo é o idioma padrão",
      "settings.sound": "Som",
      "settings.soundOnHint": "Efeitos ativados",
      "settings.soundOffHint": "Efeitos desativados",
      "settings.materials": "Material dos blocos",
      "settings.materialHint": "Ganhe 500 moedas a cada 10.000 pontos. Um novo material substitui o estilo ativo.",
      "wallet.balance": "Saldo",
      "material.status.selected": "Selecionado",
      "material.status.owned": "Selecionar",
      "material.status.buy": "Comprar e selecionar {price}",
      "material.status.need": "Faltam {price}",
      "toast.coins": "Moedas",
      "toast.coinsEarned": "+{amount} moedas por {score} pontos",
      "toast.goldenBlock": "Bloco dourado",
      "toast.goldenBlockReward": "+{amount} moedas pelo bônus de julho",
      "toast.materialBought": "Material comprado e selecionado",
      "toast.materialSelected": "Material selecionado",
      "toast.notEnoughCoins": "Moedas insuficientes",
      "material.neon.name": "Neon",
      "material.neon.detail": "Brilho clássico intenso",
      "material.glass.name": "Vidro",
      "material.glass.detail": "Blocos translúcidos com reflexos",
      "material.metal.name": "Metal",
      "material.metal.detail": "Brilho frio e textura pesada",
      "material.crystal.name": "Cristal",
      "material.crystal.detail": "Facetas marcadas e brilho",
      "material.magma.name": "Magma",
      "material.magma.detail": "Lava quente e rachaduras de fogo",
      "material.galaxy.name": "Galáxia",
      "material.galaxy.detail": "Espaço escuro com brilho estelar",
      "difficulty.easy.label": "Fácil",
      "difficulty.easy.hint": "Peças menores e ritmo suave",
      "difficulty.normal.label": "Normal",
      "difficulty.normal.hint": "Peças e pontuação equilibradas",
      "difficulty.hard.label": "Difícil",
      "difficulty.hard.hint": "Peças maiores, mais risco e recompensas",
      "stats.eyebrow": "Estatísticas",
      "stats.title": "Seu progresso",
      "stats.close": "Fechar estatísticas",
      "stats.highScore": "Melhor pontuação",
      "stats.gamesPlayed": "Jogos jogados",
      "stats.blocksPlaced": "Peças colocadas",
      "stats.linesCleared": "Linhas limpas",
      "achievements.eyebrow": "Conquistas",
      "achievements.title": "Metas",
      "achievements.close": "Fechar conquistas",
      "achievements.unlocked": "Desbloqueado {date}",
      "daily.eyebrow": "Recompensa diária",
      "daily.ready": "Bônus pronto",
      "daily.claimed": "Recebido hoje",
      "daily.boost": "bônus de pontos",
      "daily.streak": "Sequência",
      "daily.banked": "Guardado",
      "daily.claim": "Receber",
      "daily.claimedButton": "Recebido",
      "status.ready": "Pronto",
      "status.newGame": "Novo jogo",
      "status.paused": "Pausado",
      "status.go": "Vamos",
      "status.blocksReady": "Peças prontas",
      "status.gameOver": "Fim de jogo",
      "status.dailyBonus": "Bônus diário",
      "toast.difficulty": "Dificuldade",
      "toast.language": "Idioma",
      "toast.achievement": "Conquista",
      "toast.dailyReward": "Recompensa diária",
      "toast.dailyBanked": "+{amount} guardado",
      "toast.event": "Evento de julho",
      "achievement.first_block.title": "Primeira peça",
      "achievement.first_block.detail": "Coloque 1 peça",
      "achievement.block_50.title": "Mãos firmes",
      "achievement.block_50.detail": "Coloque 50 peças",
      "achievement.line_10.title": "Quebra-linhas",
      "achievement.line_10.detail": "Limpe 10 linhas",
      "achievement.line_100.title": "Mestre da grade",
      "achievement.line_100.detail": "Limpe 100 linhas",
      "achievement.score_1000.title": "Corrida brilhante",
      "achievement.score_1000.detail": "Alcance um recorde de 1.000",
      "achievement.score_5000.title": "Lenda neon",
      "achievement.score_5000.detail": "Alcance um recorde de 5.000",
      "achievement.combo_3.title": "Limpeza tripla",
      "achievement.combo_3.detail": "Limpe 3 linhas de uma vez",
      "achievement.daily_3.title": "Faísca diária",
      "achievement.daily_3.detail": "Faça uma sequência de 3 dias",
      "achievement.games_10.title": "Frequente",
      "achievement.games_10.detail": "Jogue 10 partidas"
    },
    de: {
      "app.title": "Glow Blocks - Offline-Spiel",
      "top.menu": "Menü",
      "top.pause": "Pause",
      "top.resume": "Weiter",
      "top.restart": "Neustart",
      "top.soundOn": "Ton",
      "top.soundOff": "Stumm",
      "score.current": "Punkte",
      "score.best": "Bestwert",
      "score.mode": "Modus",
      "score.coins": "Münzen",
      "score.piece": "Teil",
      "score.bonus": "Bonus",
      "score.row": "Reihe",
      "score.column": "Spalte",
      "score.combo": "Combo x{count}",
      "common.close": "Schließen",
      "common.mainMenu": "Hauptmenü",
      "board.stageLabel": "Spielfeld",
      "board.gridLabel": "8 mal 8 Spielfeld",
      "board.pieceDockLabel": "Verfügbare Teile",
      "menu.eyebrow": "Offline-Puzzle",
      "menu.best": "Bestwert",
      "menu.streak": "Serie",
      "menu.play": "Spielen",
      "menu.dailyReady": "Tägliche Belohnung",
      "menu.dailyClaimed": "Belohnung erhalten",
      "menu.achievements": "Erfolge",
      "menu.stats": "Statistik",
      "menu.updates": "Updates",
      "menu.event": "Juli-Event",
      "menu.eventReady": "Event: Belohnung bereit",
      "menu.shop": "Shop",
      "menu.settings": "Einstellungen",
      "pause.eyebrow": "Pausiert",
      "pause.title": "Kurze Pause",
      "pause.resume": "Weiter",
      "gameOver.eyebrow": "Spiel vorbei",
      "gameOver.lines": "Linien",
      "updates.eyebrow": "Updates",
      "updates.title": "Nächstes Update",
      "updates.close": "Updates schließen",
      "updates.statusSoon": "Das nächste Update kommt bald",
      "updates.statusReleased": "Das Update ist verfügbar",
      "updates.timerSoon": "Noch {time}",
      "updates.timerReleased": "Verfügbar am 1. Juli 2026",
      "updates.dateLabel": "Datum",
      "updates.dateValue": "1. Juli 2026",
      "updates.noteLabel": "Was kommt",
      "updates.note": "Juli-Event, goldener Block mit 100 Münzen, Belohnungen und verbesserte Punktebalance.",
      "event.eyebrow": "Juli-Event",
      "event.title": "Juli-Rush",
      "event.close": "Event schließen",
      "event.goalTitle": "Eventziele",
      "event.progressTitle": "Gesamtfortschritt",
      "event.goalText": "Sammle vom 1. Juli bis 1. August Punkte und hole Münzen für jedes Ziel.",
      "event.statusSoon": "Startet am 1. Juli",
      "event.statusActive": "Event aktiv",
      "event.statusEnded": "Event beendet",
      "event.timerStarts": "Start in {time}",
      "event.timerEnds": "Endet in {time}",
      "event.timerEnded": "Beendet am 1. August",
      "event.claimAll": "Bereite Belohnungen holen",
      "event.noRewards": "Keine Belohnungen bereit",
      "event.claim": "Holen",
      "event.claimed": "Erhalten",
      "event.locked": "Braucht {score}",
      "event.reward": "+{amount} Münzen",
      "event.goalReached": "{score}-Punkte-Ziel erreicht",
      "event.rewardToast": "+{amount} Event-Münzen",
      "shop.eyebrow": "Shop",
      "shop.title": "Blockmaterialien",
      "shop.close": "Shop schließen",
      "settings.eyebrow": "Einstellungen",
      "settings.title": "Spieloptionen",
      "settings.close": "Einstellungen schließen",
      "settings.difficulty": "Schwierigkeit",
      "settings.language": "Sprache",
      "settings.languageHint": "Russisch ist die Standardsprache",
      "settings.sound": "Ton",
      "settings.soundOnHint": "Effekte aktiviert",
      "settings.soundOffHint": "Effekte stumm",
      "settings.materials": "Blockmaterial",
      "settings.materialHint": "Erhalte 500 Münzen für je 10.000 Punkte. Ein neues Material ersetzt sofort den aktiven Stil.",
      "wallet.balance": "Guthaben",
      "material.status.selected": "Ausgewählt",
      "material.status.owned": "Auswählen",
      "material.status.buy": "Kaufen und auswählen {price}",
      "material.status.need": "Fehlen {price}",
      "toast.coins": "Münzen",
      "toast.coinsEarned": "+{amount} Münzen für {score} Punkte",
      "toast.goldenBlock": "Goldener Block",
      "toast.goldenBlockReward": "+{amount} Münzen für den Juli-Bonus",
      "toast.materialBought": "Material gekauft und ausgewählt",
      "toast.materialSelected": "Material ausgewählt",
      "toast.notEnoughCoins": "Nicht genug Münzen",
      "material.neon.name": "Neon",
      "material.neon.detail": "Klassisches helles Leuchten",
      "material.glass.name": "Glas",
      "material.glass.detail": "Durchscheinende Blöcke mit Glanz",
      "material.metal.name": "Metall",
      "material.metal.detail": "Kühler Glanz und schwere Textur",
      "material.crystal.name": "Kristall",
      "material.crystal.detail": "Scharfe Facetten und Funkeln",
      "material.magma.name": "Magma",
      "material.magma.detail": "Heiße Lava und feurige Risse",
      "material.galaxy.name": "Galaxie",
      "material.galaxy.detail": "Dunkler Weltraum mit Sternenglanz",
      "difficulty.easy.label": "Leicht",
      "difficulty.easy.hint": "Kleinere Teile und ruhigeres Tempo",
      "difficulty.normal.label": "Normal",
      "difficulty.normal.hint": "Ausgewogene Teile und Punkte",
      "difficulty.hard.label": "Schwer",
      "difficulty.hard.hint": "Größere Teile, mehr Risiko und Belohnung",
      "stats.eyebrow": "Statistik",
      "stats.title": "Dein Fortschritt",
      "stats.close": "Statistik schließen",
      "stats.highScore": "Bester Punktestand",
      "stats.gamesPlayed": "Gespielte Spiele",
      "stats.blocksPlaced": "Gesetzte Teile",
      "stats.linesCleared": "Gelöschte Linien",
      "achievements.eyebrow": "Erfolge",
      "achievements.title": "Meilensteine",
      "achievements.close": "Erfolge schließen",
      "achievements.unlocked": "Freigeschaltet {date}",
      "daily.eyebrow": "Tägliche Belohnung",
      "daily.ready": "Bonus bereit",
      "daily.claimed": "Heute erhalten",
      "daily.boost": "Punktebonus",
      "daily.streak": "Serie",
      "daily.banked": "Gespart",
      "daily.claim": "Abholen",
      "daily.claimedButton": "Erhalten",
      "status.ready": "Bereit",
      "status.newGame": "Neues Spiel",
      "status.paused": "Pausiert",
      "status.go": "Los",
      "status.blocksReady": "Teile bereit",
      "status.gameOver": "Spiel vorbei",
      "status.dailyBonus": "Tagesbonus",
      "toast.difficulty": "Schwierigkeit",
      "toast.language": "Sprache",
      "toast.achievement": "Erfolg",
      "toast.dailyReward": "Tägliche Belohnung",
      "toast.dailyBanked": "+{amount} gespart",
      "toast.event": "Juli-Event",
      "achievement.first_block.title": "Erster Zug",
      "achievement.first_block.detail": "Setze 1 Teil",
      "achievement.block_50.title": "Ruhige Hand",
      "achievement.block_50.detail": "Setze 50 Teile",
      "achievement.line_10.title": "Linienbrecher",
      "achievement.line_10.detail": "Lösche 10 Linien",
      "achievement.line_100.title": "Rastermeister",
      "achievement.line_100.detail": "Lösche 100 Linien",
      "achievement.score_1000.title": "Leuchtlauf",
      "achievement.score_1000.detail": "Erreiche einen Bestwert von 1.000",
      "achievement.score_5000.title": "Neonlegende",
      "achievement.score_5000.detail": "Erreiche einen Bestwert von 5.000",
      "achievement.combo_3.title": "Dreifach gelöscht",
      "achievement.combo_3.detail": "Lösche 3 Linien auf einmal",
      "achievement.daily_3.title": "Täglicher Funke",
      "achievement.daily_3.detail": "Erreiche eine 3-Tage-Serie",
      "achievement.games_10.title": "Stammspieler",
      "achievement.games_10.detail": "Spiele 10 Partien"
    },
    it: {
      "app.title": "Glow Blocks - gioco offline",
      "top.menu": "Menu",
      "top.pause": "Pausa",
      "top.resume": "Riprendi",
      "top.restart": "Ricomincia",
      "top.soundOn": "Audio",
      "top.soundOff": "Muto",
      "score.current": "Punti",
      "score.best": "Record",
      "score.mode": "Modalità",
      "score.coins": "Monete",
      "score.piece": "Pezzo",
      "score.bonus": "Bonus",
      "score.row": "Riga",
      "score.column": "Colonna",
      "score.combo": "Combo x{count}",
      "common.close": "Chiudi",
      "common.mainMenu": "Menu principale",
      "board.stageLabel": "Griglia di gioco",
      "board.gridLabel": "Griglia 8 per 8",
      "board.pieceDockLabel": "Pezzi disponibili",
      "menu.eyebrow": "Puzzle offline",
      "menu.best": "Record",
      "menu.streak": "Serie",
      "menu.play": "Gioca",
      "menu.dailyReady": "Ricompensa giornaliera",
      "menu.dailyClaimed": "Ricompensa ottenuta",
      "menu.achievements": "Obiettivi",
      "menu.stats": "Statistiche",
      "menu.updates": "Aggiornamenti",
      "menu.event": "Evento di luglio",
      "menu.eventReady": "Evento: premio pronto",
      "menu.shop": "Negozio",
      "menu.settings": "Impostazioni",
      "pause.eyebrow": "Pausa",
      "pause.title": "Pausa breve",
      "pause.resume": "Riprendi",
      "gameOver.eyebrow": "Fine partita",
      "gameOver.lines": "Linee",
      "updates.eyebrow": "Aggiornamenti",
      "updates.title": "Prossimo aggiornamento",
      "updates.close": "Chiudi aggiornamenti",
      "updates.statusSoon": "Il prossimo aggiornamento arriva presto",
      "updates.statusReleased": "Aggiornamento disponibile",
      "updates.timerSoon": "Mancano {time}",
      "updates.timerReleased": "Disponibile il 1 luglio 2026",
      "updates.dateLabel": "Data",
      "updates.dateValue": "1 luglio 2026",
      "updates.noteLabel": "In arrivo",
      "updates.note": "Evento di luglio, blocco dorato da 100 monete, ricompense e bilanciamento punti migliorato.",
      "event.eyebrow": "Evento di luglio",
      "event.title": "Scatto di luglio",
      "event.close": "Chiudi evento",
      "event.goalTitle": "Obiettivi evento",
      "event.progressTitle": "Progresso totale",
      "event.goalText": "Ottieni punti dal 1 luglio al 1 agosto e ricevi monete per ogni obiettivo.",
      "event.statusSoon": "Inizia il 1 luglio",
      "event.statusActive": "Evento attivo",
      "event.statusEnded": "Evento terminato",
      "event.timerStarts": "Inizia tra {time}",
      "event.timerEnds": "Finisce tra {time}",
      "event.timerEnded": "Terminato il 1 agosto",
      "event.claimAll": "Ottieni premi disponibili",
      "event.noRewards": "Nessun premio pronto",
      "event.claim": "Ottieni",
      "event.claimed": "Ottenuto",
      "event.locked": "Servono {score}",
      "event.reward": "+{amount} monete",
      "event.goalReached": "Obiettivo {score} punti raggiunto",
      "event.rewardToast": "+{amount} monete evento",
      "shop.eyebrow": "Negozio",
      "shop.title": "Materiali dei blocchi",
      "shop.close": "Chiudi negozio",
      "settings.eyebrow": "Impostazioni",
      "settings.title": "Configurazione",
      "settings.close": "Chiudi impostazioni",
      "settings.difficulty": "Difficoltà",
      "settings.language": "Lingua",
      "settings.languageHint": "Il russo è la lingua predefinita",
      "settings.sound": "Audio",
      "settings.soundOnHint": "Effetti attivati",
      "settings.soundOffHint": "Effetti disattivati",
      "settings.materials": "Materiale dei blocchi",
      "settings.materialHint": "Ottieni 500 monete ogni 10.000 punti. Un nuovo materiale sostituisce subito lo stile attivo.",
      "wallet.balance": "Saldo",
      "material.status.selected": "Selezionato",
      "material.status.owned": "Seleziona",
      "material.status.buy": "Compra e seleziona {price}",
      "material.status.need": "Servono {price}",
      "toast.coins": "Monete",
      "toast.coinsEarned": "+{amount} monete per {score} punti",
      "toast.goldenBlock": "Blocco dorato",
      "toast.goldenBlockReward": "+{amount} monete per il bonus di luglio",
      "toast.materialBought": "Materiale comprato e selezionato",
      "toast.materialSelected": "Materiale selezionato",
      "toast.notEnoughCoins": "Monete insufficienti",
      "material.neon.name": "Neon",
      "material.neon.detail": "Classico bagliore brillante",
      "material.glass.name": "Vetro",
      "material.glass.detail": "Blocchi traslucidi con riflessi",
      "material.metal.name": "Metallo",
      "material.metal.detail": "Lucentezza fredda e texture pesante",
      "material.crystal.name": "Cristallo",
      "material.crystal.detail": "Faccette nette e scintillio",
      "material.magma.name": "Magma",
      "material.magma.detail": "Lava calda e crepe di fuoco",
      "material.galaxy.name": "Galassia",
      "material.galaxy.detail": "Spazio scuro con bagliore stellare",
      "difficulty.easy.label": "Facile",
      "difficulty.easy.hint": "Pezzi più piccoli e ritmo più morbido",
      "difficulty.normal.label": "Normale",
      "difficulty.normal.hint": "Pezzi e punteggio bilanciati",
      "difficulty.hard.label": "Difficile",
      "difficulty.hard.hint": "Pezzi grandi, più rischio e premi",
      "stats.eyebrow": "Statistiche",
      "stats.title": "I tuoi progressi",
      "stats.close": "Chiudi statistiche",
      "stats.highScore": "Miglior punteggio",
      "stats.gamesPlayed": "Partite giocate",
      "stats.blocksPlaced": "Pezzi posizionati",
      "stats.linesCleared": "Linee eliminate",
      "achievements.eyebrow": "Obiettivi",
      "achievements.title": "Traguardi",
      "achievements.close": "Chiudi obiettivi",
      "achievements.unlocked": "Sbloccato {date}",
      "daily.eyebrow": "Ricompensa giornaliera",
      "daily.ready": "Bonus pronto",
      "daily.claimed": "Ottenuto oggi",
      "daily.boost": "bonus punti",
      "daily.streak": "Serie",
      "daily.banked": "In riserva",
      "daily.claim": "Ottieni",
      "daily.claimedButton": "Ottenuto",
      "status.ready": "Pronto",
      "status.newGame": "Nuova partita",
      "status.paused": "Pausa",
      "status.go": "Vai",
      "status.blocksReady": "Pezzi pronti",
      "status.gameOver": "Fine partita",
      "status.dailyBonus": "Bonus giornaliero",
      "toast.difficulty": "Difficoltà",
      "toast.language": "Lingua",
      "toast.achievement": "Obiettivo",
      "toast.dailyReward": "Ricompensa giornaliera",
      "toast.dailyBanked": "+{amount} in riserva",
      "toast.event": "Evento di luglio",
      "achievement.first_block.title": "Prima mossa",
      "achievement.first_block.detail": "Posiziona 1 pezzo",
      "achievement.block_50.title": "Mano ferma",
      "achievement.block_50.detail": "Posiziona 50 pezzi",
      "achievement.line_10.title": "Rompi-linee",
      "achievement.line_10.detail": "Elimina 10 linee",
      "achievement.line_100.title": "Maestro della griglia",
      "achievement.line_100.detail": "Elimina 100 linee",
      "achievement.score_1000.title": "Corsa luminosa",
      "achievement.score_1000.detail": "Raggiungi un record di 1.000",
      "achievement.score_5000.title": "Leggenda neon",
      "achievement.score_5000.detail": "Raggiungi un record di 5.000",
      "achievement.combo_3.title": "Tripla pulizia",
      "achievement.combo_3.detail": "Elimina 3 linee in una volta",
      "achievement.daily_3.title": "Scintilla giornaliera",
      "achievement.daily_3.detail": "Ottieni una serie di 3 giorni",
      "achievement.games_10.title": "Abituale",
      "achievement.games_10.detail": "Gioca 10 partite"
    },
    uk: {
      "app.title": "Glow Blocks - офлайн гра",
      "top.menu": "Меню",
      "top.pause": "Пауза",
      "top.resume": "Продовжити",
      "top.restart": "Заново",
      "top.soundOn": "Звук",
      "top.soundOff": "Без звуку",
      "score.current": "Рахунок",
      "score.best": "Рекорд",
      "score.mode": "Режим",
      "score.coins": "Монети",
      "score.piece": "Фігура",
      "score.bonus": "Бонус",
      "score.row": "Рядок",
      "score.column": "Стовпець",
      "score.combo": "Комбо x{count}",
      "common.close": "Закрити",
      "common.mainMenu": "Головне меню",
      "board.stageLabel": "Ігрове поле",
      "board.gridLabel": "Ігрове поле 8 на 8",
      "board.pieceDockLabel": "Доступні фігури",
      "menu.eyebrow": "Офлайн головоломка",
      "menu.best": "Рекорд",
      "menu.streak": "Серія",
      "menu.play": "Грати",
      "menu.dailyReady": "Щоденна нагорода",
      "menu.dailyClaimed": "Нагороду отримано",
      "menu.achievements": "Досягнення",
      "menu.stats": "Статистика",
      "menu.updates": "Оновлення",
      "menu.event": "Подія липня",
      "menu.eventReady": "Подія: нагорода готова",
      "menu.shop": "Магазин",
      "menu.settings": "Налаштування",
      "pause.eyebrow": "Пауза",
      "pause.title": "Перепочинок",
      "pause.resume": "Продовжити",
      "gameOver.eyebrow": "Кінець гри",
      "gameOver.lines": "Лінії",
      "updates.eyebrow": "Оновлення",
      "updates.title": "Наступне оновлення",
      "updates.close": "Закрити оновлення",
      "updates.statusSoon": "Наступне оновлення вже скоро",
      "updates.statusReleased": "Оновлення вже вийшло",
      "updates.timerSoon": "Залишилось {time}",
      "updates.timerReleased": "Вийшло 1 липня 2026",
      "updates.dateLabel": "Дата",
      "updates.dateValue": "1 липня 2026",
      "updates.noteLabel": "Що буде",
      "updates.note": "Липнева подія, золотий блок на 100 монет, нагороди та покращений баланс очок.",
      "event.eyebrow": "Подія липня",
      "event.title": "Липневий ривок",
      "event.close": "Закрити подію",
      "event.goalTitle": "Цілі події",
      "event.progressTitle": "Загальний прогрес",
      "event.goalText": "Набирайте очки з 1 липня до 1 серпня й отримуйте монети за кожну ціль.",
      "event.statusSoon": "Почнеться 1 липня",
      "event.statusActive": "Подія активна",
      "event.statusEnded": "Подію завершено",
      "event.timerStarts": "До початку {time}",
      "event.timerEnds": "До кінця {time}",
      "event.timerEnded": "Завершилась 1 серпня",
      "event.claimAll": "Забрати доступні нагороди",
      "event.noRewards": "Немає готових нагород",
      "event.claim": "Забрати",
      "event.claimed": "Отримано",
      "event.locked": "Потрібно {score}",
      "event.reward": "+{amount} монет",
      "event.goalReached": "Ціль {score} очок досягнута",
      "event.rewardToast": "+{amount} монет за подію",
      "shop.eyebrow": "Магазин",
      "shop.title": "Матеріали блоків",
      "shop.close": "Закрити магазин",
      "settings.eyebrow": "Налаштування",
      "settings.title": "Параметри гри",
      "settings.close": "Закрити налаштування",
      "settings.difficulty": "Складність",
      "settings.language": "Мова",
      "settings.languageHint": "Російська мова за замовчуванням",
      "settings.sound": "Звук",
      "settings.soundOnHint": "Ефекти увімкнено",
      "settings.soundOffHint": "Ефекти вимкнено",
      "settings.materials": "Матеріал блоків",
      "settings.materialHint": "Отримуйте 500 монет за кожні 10 000 очок. Новий матеріал одразу замінює активний стиль.",
      "wallet.balance": "Баланс",
      "material.status.selected": "Вибрано",
      "material.status.owned": "Вибрати",
      "material.status.buy": "Купити й вибрати {price}",
      "material.status.need": "Потрібно {price}",
      "toast.coins": "Монети",
      "toast.coinsEarned": "+{amount} монет за {score} очок",
      "toast.goldenBlock": "Золотий блок",
      "toast.goldenBlockReward": "+{amount} монет за липневий бонус",
      "toast.materialBought": "Матеріал куплено й вибрано",
      "toast.materialSelected": "Матеріал вибрано",
      "toast.notEnoughCoins": "Не вистачає монет",
      "material.neon.name": "Неон",
      "material.neon.detail": "Класичне яскраве світіння",
      "material.glass.name": "Скло",
      "material.glass.detail": "Напівпрозорі блоки з відблисками",
      "material.metal.name": "Метал",
      "material.metal.detail": "Холодний блиск і важка фактура",
      "material.crystal.name": "Кристал",
      "material.crystal.detail": "Гострі грані та сяйво",
      "material.magma.name": "Магма",
      "material.magma.detail": "Гаряча лава та вогняні тріщини",
      "material.galaxy.name": "Галактика",
      "material.galaxy.detail": "Темний космос із зоряним світінням",
      "difficulty.easy.label": "Легкий",
      "difficulty.easy.hint": "Менше великих фігур і м'якший темп",
      "difficulty.normal.label": "Нормальний",
      "difficulty.normal.hint": "Збалансовані фігури та очки",
      "difficulty.hard.label": "Складний",
      "difficulty.hard.hint": "Великі фігури, вищий ризик і нагороди",
      "stats.eyebrow": "Статистика",
      "stats.title": "Ваш прогрес",
      "stats.close": "Закрити статистику",
      "stats.highScore": "Найкращий рахунок",
      "stats.gamesPlayed": "Зіграно ігор",
      "stats.blocksPlaced": "Усього розміщено фігур",
      "stats.linesCleared": "Усього очищено ліній",
      "achievements.eyebrow": "Досягнення",
      "achievements.title": "Нагороди",
      "achievements.close": "Закрити досягнення",
      "achievements.unlocked": "Відкрито {date}",
      "daily.eyebrow": "Щоденна нагорода",
      "daily.ready": "Бонус готовий",
      "daily.claimed": "Сьогодні отримано",
      "daily.boost": "бонус до рахунку",
      "daily.streak": "Серія",
      "daily.banked": "У запасі",
      "daily.claim": "Забрати",
      "daily.claimedButton": "Отримано",
      "status.ready": "Готово",
      "status.newGame": "Нова гра",
      "status.paused": "Пауза",
      "status.go": "Вперед",
      "status.blocksReady": "Фігури готові",
      "status.gameOver": "Кінець гри",
      "status.dailyBonus": "Щоденний бонус",
      "toast.difficulty": "Складність",
      "toast.language": "Мова",
      "toast.achievement": "Досягнення",
      "toast.dailyReward": "Щоденна нагорода",
      "toast.dailyBanked": "+{amount} у запасі",
      "toast.event": "Подія липня",
      "achievement.first_block.title": "Перший хід",
      "achievement.first_block.detail": "Розмістіть 1 фігуру",
      "achievement.block_50.title": "Тверда рука",
      "achievement.block_50.detail": "Розмістіть 50 фігур",
      "achievement.line_10.title": "Ламач ліній",
      "achievement.line_10.detail": "Очистіть 10 ліній",
      "achievement.line_100.title": "Майстер сітки",
      "achievement.line_100.detail": "Очистіть 100 ліній",
      "achievement.score_1000.title": "Неоновий ривок",
      "achievement.score_1000.detail": "Досягніть рекорду 1 000",
      "achievement.score_5000.title": "Неонова легенда",
      "achievement.score_5000.detail": "Досягніть рекорду 5 000",
      "achievement.combo_3.title": "Потрійне очищення",
      "achievement.combo_3.detail": "Очистіть 3 лінії за хід",
      "achievement.daily_3.title": "Щоденна іскра",
      "achievement.daily_3.detail": "Зберіть серію 3 дні",
      "achievement.games_10.title": "Постійний гравець",
      "achievement.games_10.detail": "Зіграйте 10 ігор"
    }
  };

  const dom = {
    board: document.querySelector("#board"),
    pieceTray: document.querySelector("#pieceTray"),
    particleCanvas: document.querySelector("#particleCanvas"),
    scorePopLayer: document.querySelector("#scorePopLayer"),
    toastStack: document.querySelector("#toastStack"),
    scoreValue: document.querySelector("#scoreValue"),
    highScoreValue: document.querySelector("#highScoreValue"),
    coinsValue: document.querySelector("#coinsValue"),
    difficultyBadge: document.querySelector("#difficultyBadge"),
    statusRibbon: document.querySelector("#statusRibbon"),
    openMenuButton: document.querySelector("#openMenuButton"),
    pauseButton: document.querySelector("#pauseButton"),
    restartButton: document.querySelector("#restartButton"),
    muteButton: document.querySelector("#muteButton"),
    playButton: document.querySelector("#playButton"),
    dailyButton: document.querySelector("#dailyButton"),
    eventButton: document.querySelector("#eventButton"),
    updatesButton: document.querySelector("#updatesButton"),
    shopButton: document.querySelector("#shopButton"),
    achievementsButton: document.querySelector("#achievementsButton"),
    statsButton: document.querySelector("#statsButton"),
    settingsButton: document.querySelector("#settingsButton"),
    resumeButton: document.querySelector("#resumeButton"),
    pauseRestartButton: document.querySelector("#pauseRestartButton"),
    pauseMenuButton: document.querySelector("#pauseMenuButton"),
    gameOverRestartButton: document.querySelector("#gameOverRestartButton"),
    gameOverMenuButton: document.querySelector("#gameOverMenuButton"),
    gameOverStatsButton: document.querySelector("#gameOverStatsButton"),
    gameOverScore: document.querySelector("#gameOverScore"),
    gameOverBest: document.querySelector("#gameOverBest"),
    gameOverLines: document.querySelector("#gameOverLines"),
    difficultyControls: document.querySelector("#difficultyControls"),
    difficultyHint: document.querySelector("#difficultyHint"),
    languageSelect: document.querySelector("#languageSelect"),
    languageHint: document.querySelector("#languageHint"),
    settingsSoundButton: document.querySelector("#settingsSoundButton"),
    soundHint: document.querySelector("#soundHint"),
    materialHint: document.querySelector("#materialHint"),
    materialShop: document.querySelector("#materialShop"),
    walletCoinsValue: document.querySelector("#walletCoinsValue"),
    shopMaterialHint: document.querySelector("#shopMaterialHint"),
    shopMaterialShop: document.querySelector("#shopMaterialShop"),
    shopWalletCoinsValue: document.querySelector("#shopWalletCoinsValue"),
    statHighScore: document.querySelector("#statHighScore"),
    statGamesPlayed: document.querySelector("#statGamesPlayed"),
    statBlocksPlaced: document.querySelector("#statBlocksPlaced"),
    statLinesCleared: document.querySelector("#statLinesCleared"),
    achievementList: document.querySelector("#achievementList"),
    dailyTitle: document.querySelector("#dailyTitle"),
    dailyRewardAmount: document.querySelector("#dailyRewardAmount"),
    dailyStreakValue: document.querySelector("#dailyStreakValue"),
    dailyBankedValue: document.querySelector("#dailyBankedValue"),
    claimDailyButton: document.querySelector("#claimDailyButton"),
    claimJulyEventButton: document.querySelector("#claimJulyEventButton"),
    julyEventStatus: document.querySelector("#julyEventStatus"),
    julyEventTimer: document.querySelector("#julyEventTimer"),
    julyEventGoalText: document.querySelector("#julyEventGoalText"),
    julyEventProgressBar: document.querySelector("#julyEventProgressBar"),
    julyEventProgressText: document.querySelector("#julyEventProgressText"),
    julyEventReward: document.querySelector("#julyEventReward"),
    julyEventGoals: document.querySelector("#julyEventGoals"),
    nextUpdateStatus: document.querySelector("#nextUpdateStatus"),
    nextUpdateTimer: document.querySelector("#nextUpdateTimer"),
    nextUpdateDate: document.querySelector("#nextUpdateDate"),
    menuBestScore: document.querySelector("#menuBestScore"),
    menuDailyStreak: document.querySelector("#menuDailyStreak"),
    modals: {
      mainMenu: document.querySelector("#mainMenu"),
      pauseModal: document.querySelector("#pauseModal"),
      gameOverModal: document.querySelector("#gameOverModal"),
      settingsModal: document.querySelector("#settingsModal"),
      shopModal: document.querySelector("#shopModal"),
      eventModal: document.querySelector("#eventModal"),
      updatesModal: document.querySelector("#updatesModal"),
      statsModal: document.querySelector("#statsModal"),
      achievementsModal: document.querySelector("#achievementsModal"),
      dailyModal: document.querySelector("#dailyModal")
    }
  };

  const state = {
    board: createEmptyBoard(),
    pieces: [],
    score: 0,
    linesThisGame: 0,
    running: false,
    paused: false,
    busy: false,
    gameOver: false,
    difficulty: "normal",
    coinMilestonesAwarded: 0,
    goldenBlockIndex: -1,
    drag: null
  };

  let save = loadSave();
  let pieceSerial = 0;
  let modalBackTarget = null;
  let audioContext = null;
  let cellEls = [];
  let particles = [];
  let particleFrame = 0;
  let lastParticleTime = 0;
  let canvasContext = null;
  let julyEventTicker = 0;
  let updatesTicker = 0;

  function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  }

  function loadSave() {
    const defaults = {
      highScore: 0,
      gamesPlayed: 0,
      totalBlocksPlaced: 0,
      totalLinesCleared: 0,
      coins: 0,
      ownedMaterials: ["neon"],
      selectedMaterial: "neon",
      bestCombo: 0,
      achievements: {},
      events: {
        [JULY_EVENT_ID]: {
          score: 0,
          claimedGoals: [],
          claimedAt: ""
        }
      },
      lastDailyClaim: "",
      dailyStreak: 0,
      dailyBonusBank: 0,
      settings: {
        sound: true,
        difficulty: "normal",
        language: "ru"
      }
    };

    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const loaded = {
        ...defaults,
        ...parsed,
        achievements: { ...defaults.achievements, ...(parsed.achievements || {}) },
        events: { ...defaults.events, ...(parsed.events || {}) },
        settings: { ...defaults.settings, ...(parsed.settings || {}) }
      };
      loaded.events[JULY_EVENT_ID] = {
        ...defaults.events[JULY_EVENT_ID],
        ...(loaded.events[JULY_EVENT_ID] || {})
      };
      const materialIds = new Set(BLOCK_MATERIALS.map((material) => material.id));
      loaded.coins = Number.isFinite(Number(loaded.coins)) ? Math.max(0, Math.floor(Number(loaded.coins))) : 0;
      loaded.events[JULY_EVENT_ID].score = Number.isFinite(Number(loaded.events[JULY_EVENT_ID].score))
        ? Math.max(0, Math.floor(Number(loaded.events[JULY_EVENT_ID].score)))
        : 0;
      if (Array.isArray(loaded.events[JULY_EVENT_ID].claimedGoals)) {
        const validGoals = new Set(JULY_EVENT_GOALS.map((goal) => goal.score));
        loaded.events[JULY_EVENT_ID].claimedGoals = [...new Set(loaded.events[JULY_EVENT_ID].claimedGoals
          .map((goalScore) => Number(goalScore))
          .filter((goalScore) => validGoals.has(goalScore)))];
      } else if (loaded.events[JULY_EVENT_ID].rewardClaimed) {
        loaded.events[JULY_EVENT_ID].claimedGoals = [JULY_EVENT_GOALS[0].score];
      } else {
        loaded.events[JULY_EVENT_ID].claimedGoals = [];
      }
      loaded.events[JULY_EVENT_ID].claimedAt = typeof loaded.events[JULY_EVENT_ID].claimedAt === "string"
        ? loaded.events[JULY_EVENT_ID].claimedAt
        : "";
      loaded.ownedMaterials = Array.isArray(loaded.ownedMaterials) ? loaded.ownedMaterials.filter((id) => materialIds.has(id)) : ["neon"];
      if (!loaded.ownedMaterials.includes("neon")) {
        loaded.ownedMaterials.unshift("neon");
      }
      loaded.selectedMaterial = materialIds.has(loaded.selectedMaterial) && loaded.ownedMaterials.includes(loaded.selectedMaterial) ? loaded.selectedMaterial : "neon";
      return loaded;
    } catch (error) {
      return defaults;
    }
  }

  function saveGame() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }

  function currentLanguageCode() {
    return Object.prototype.hasOwnProperty.call(I18N, save.settings.language) ? save.settings.language : "ru";
  }

  function languageMeta(code = currentLanguageCode()) {
    return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
  }

  function t(key, replacements = {}) {
    const dictionary = I18N[currentLanguageCode()] || I18N.ru;
    const fallback = I18N.ru[key] || key;
    let value = dictionary[key] || fallback;

    Object.entries(replacements).forEach(([name, replacement]) => {
      value = value.split(`{${name}}`).join(String(replacement));
    });

    return value;
  }

  function achievementCopy(id) {
    const original = ACHIEVEMENTS.find((achievement) => achievement.id === id) || {};
    return {
      title: t(`achievement.${id}.title`) || original.title || id,
      detail: t(`achievement.${id}.detail`) || original.detail || id
    };
  }

  function buildLanguageOptions() {
    if (!dom.languageSelect) {
      return;
    }
    dom.languageSelect.innerHTML = "";
    LANGUAGES.forEach((language) => {
      const option = document.createElement("option");
      option.value = language.code;
      option.textContent = language.name;
      dom.languageSelect.appendChild(option);
    });
  }

  function applyTranslations() {
    document.documentElement.lang = currentLanguageCode();
    document.title = t("app.title");

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAria));
    });
  }

  function formatNumber(value) {
    const locale = languageMeta().locale;
    return Math.max(0, Math.round(value)).toLocaleString(locale);
  }

  function localDateKey(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function createPiece(shapeId) {
    const shape = SHAPE_DATA[shapeId];
    return {
      uid: `piece-${pieceSerial++}`,
      shapeId,
      cells: shape.cells.map(([x, y]) => ({ x, y })),
      width: shape.width,
      height: shape.height,
      color: randomFrom(COLORS),
      material: selectedMaterialId(),
      used: false
    };
  }

  function difficultyConfig() {
    return DIFFICULTIES[state.difficulty] || DIFFICULTIES.normal;
  }

  function selectedMaterialId() {
    return BLOCK_MATERIALS.some((material) => material.id === save.selectedMaterial) ? save.selectedMaterial : "neon";
  }

  function isMaterialOwned(id) {
    return save.ownedMaterials.includes(id);
  }

  function init() {
    state.difficulty = save.settings.difficulty in DIFFICULTIES ? save.settings.difficulty : "normal";
    save.settings.language = Object.prototype.hasOwnProperty.call(I18N, save.settings.language) ? save.settings.language : "ru";
    canvasContext = dom.particleCanvas ? dom.particleCanvas.getContext("2d") : null;
    buildLanguageOptions();
    applyTranslations();
    buildBoard();
    resizeParticleCanvas();
    bindEvents();
    updateAllStaticUi();
    startJulyEventTicker();
    startUpdatesTicker();
    renderPieces();
    syncBoard();
    openMainMenu();
    showStatus(t("status.ready"));
    checkAchievements();
  }

  function buildBoard() {
    dom.board.innerHTML = "";
    cellEls = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.dataset.index = String(indexFor(row, col));
        cell.setAttribute("role", "gridcell");
        dom.board.appendChild(cell);
        cellEls.push(cell);
      }
    }
  }

  function bindEvents() {
    dom.openMenuButton.addEventListener("click", () => openMainMenu());
    dom.playButton.addEventListener("click", handlePlay);
    dom.pauseButton.addEventListener("click", togglePause);
    dom.restartButton.addEventListener("click", () => startNewGame());
    dom.resumeButton.addEventListener("click", resumeGame);
    dom.pauseRestartButton.addEventListener("click", () => startNewGame());
    dom.pauseMenuButton.addEventListener("click", () => openMainMenu());
    dom.gameOverRestartButton.addEventListener("click", () => startNewGame());
    dom.gameOverMenuButton.addEventListener("click", () => openMainMenu());
    dom.gameOverStatsButton.addEventListener("click", () => openStats("gameOverModal"));
    dom.settingsButton.addEventListener("click", () => openSettings("mainMenu"));
    if (dom.eventButton) {
      dom.eventButton.addEventListener("click", () => openJulyEvent("mainMenu"));
    }
    if (dom.updatesButton) {
      dom.updatesButton.addEventListener("click", () => openUpdates("mainMenu"));
    }
    if (dom.shopButton) {
      dom.shopButton.addEventListener("click", () => openShop("mainMenu"));
    }
    dom.statsButton.addEventListener("click", () => openStats("mainMenu"));
    dom.achievementsButton.addEventListener("click", () => openAchievements("mainMenu"));
    dom.dailyButton.addEventListener("click", () => openDaily("mainMenu"));
    dom.claimDailyButton.addEventListener("click", claimDailyReward);
    if (dom.claimJulyEventButton) {
      dom.claimJulyEventButton.addEventListener("click", () => claimJulyEventRewards());
    }
    if (dom.julyEventGoals) {
      dom.julyEventGoals.addEventListener("click", handleJulyEventGoalClick);
    }
    dom.board.addEventListener("click", handleGoldenBlockClick);
    dom.board.addEventListener("keydown", handleGoldenBlockKeydown);
    dom.muteButton.addEventListener("click", toggleSound);
    if (dom.settingsSoundButton) {
      dom.settingsSoundButton.addEventListener("click", toggleSound);
    }
    dom.difficultyControls.addEventListener("click", handleDifficultyClick);
    if (dom.languageSelect) {
      dom.languageSelect.addEventListener("change", handleLanguageChange);
    }
    materialShopTargets().forEach((shop) => {
      shop.addEventListener("click", handleMaterialClick);
    });

    document.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => closeModalWithReturn(button.dataset.closeModal));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const activeModal = getActiveModalId();
        if (activeModal && activeModal !== "mainMenu" && activeModal !== "gameOverModal") {
          closeModalWithReturn(activeModal);
          return;
        }
        if (state.running && !state.gameOver) {
          togglePause();
        }
      }
    });

    document.addEventListener("pointerdown", () => {
      if (save.settings.sound) {
        ensureAudio();
      }
    }, { once: true });

    window.addEventListener("resize", resizeParticleCanvas);
  }

  function handlePlay() {
    if (state.running && !state.gameOver && state.paused) {
      resumeGame();
      return;
    }

    startNewGame();
  }

  function startNewGame() {
    clearAllModals();
    clearPreview();
    clearDrag();
    state.board = createEmptyBoard();
    state.pieces = [];
    state.score = 0;
    state.linesThisGame = 0;
    state.running = true;
    state.paused = false;
    state.busy = false;
    state.gameOver = false;
    state.coinMilestonesAwarded = 0;
    state.goldenBlockIndex = -1;
    state.difficulty = save.settings.difficulty in DIFFICULTIES ? save.settings.difficulty : "normal";
    save.gamesPlayed += 1;
    saveGame();
    syncBoard();
    spawnGoldenBlock();
    generatePieces();
    updateScoreDisplays(false);
    updateAllStaticUi();
    applyBankedDailyBonus();
    showStatus(t("status.newGame"));
    playSound("start");
    checkAchievements();
    checkGameOver();
  }

  function togglePause() {
    if (!state.running || state.gameOver) {
      return;
    }

    if (state.paused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }

  function pauseGame() {
    if (!state.running || state.gameOver) {
      return;
    }
    state.paused = true;
    clearDrag();
    openModal("pauseModal");
    updatePauseButton();
    showStatus(t("status.paused"));
  }

  function resumeGame() {
    if (!state.running || state.gameOver) {
      return;
    }
    state.paused = false;
    clearAllModals();
    updatePauseButton();
    showStatus(t("status.go"));
  }

  function updatePauseButton() {
    dom.pauseButton.textContent = state.paused ? t("top.resume") : t("top.pause");
  }

  function openMainMenu() {
    if (state.running && !state.gameOver) {
      state.paused = true;
      updatePauseButton();
      clearDrag();
    }

    modalBackTarget = null;
    clearAllModals();
    updateMenuUi();
    dom.modals.mainMenu.classList.add("active");
  }

  function openSettings(backTarget) {
    updateSettingsUi();
    openModal("settingsModal", backTarget);
  }

  function openShop(backTarget) {
    updateShopUi();
    openModal("shopModal", backTarget);
  }

  function openJulyEvent(backTarget) {
    updateJulyEventUi();
    openModal("eventModal", backTarget);
  }

  function openUpdates(backTarget) {
    updateUpdatesUi();
    openModal("updatesModal", backTarget);
  }

  function openStats(backTarget) {
    updateStatsUi();
    openModal("statsModal", backTarget);
  }

  function openAchievements(backTarget) {
    renderAchievements();
    openModal("achievementsModal", backTarget);
  }

  function openDaily(backTarget) {
    updateDailyUi();
    openModal("dailyModal", backTarget);
  }

  function openModal(id, backTarget = null) {
    clearAllModals();
    modalBackTarget = backTarget;
    if (dom.modals[id]) {
      dom.modals[id].classList.add("active");
    }
  }

  function closeModalWithReturn(id) {
    if (dom.modals[id]) {
      dom.modals[id].classList.remove("active");
    }

    const target = modalBackTarget;
    modalBackTarget = null;

    if (target === "mainMenu") {
      openMainMenu();
    } else if (target === "gameOverModal") {
      updateGameOverUi();
      openModal("gameOverModal");
    } else if (!state.running && !state.gameOver) {
      openMainMenu();
    }
  }

  function clearAllModals() {
    Object.values(dom.modals).forEach((modal) => {
      if (modal) {
        modal.classList.remove("active");
      }
    });
  }

  function getActiveModalId() {
    const activeEntry = Object.entries(dom.modals).find(([, modal]) => modal && modal.classList.contains("active"));
    return activeEntry ? activeEntry[0] : "";
  }

  function generatePieces() {
    const config = difficultyConfig();
    state.pieces = Array.from({ length: 3 }, () => createPiece(randomFrom(config.pool)));

    const hasGeneratedMove = state.pieces.some((piece) => canPieceFitAnywhere(piece));
    const fittingShapeIds = config.pool.filter((shapeId) => canShapeFitAnywhere(SHAPE_DATA[shapeId]));

    if (!hasGeneratedMove && fittingShapeIds.length > 0) {
      state.pieces[Math.floor(Math.random() * state.pieces.length)] = createPiece(randomFrom(fittingShapeIds));
    }

    renderPieces();
    showStatus(t("status.blocksReady"));
  }

  function renderPieces() {
    if (!dom.pieceTray) {
      return;
    }

    dom.pieceTray.innerHTML = "";

    for (let index = 0; index < 3; index += 1) {
      const piece = state.pieces[index];
      const slot = document.createElement("div");
      slot.className = `piece-slot${!piece || piece.used ? " used" : ""}`;
      slot.dataset.index = String(index);

      if (piece && !piece.used) {
        const pieceEl = createPieceElement(piece, index);
        pieceEl.addEventListener("pointerdown", (event) => startDrag(event, index));
        slot.appendChild(pieceEl);
      }

      dom.pieceTray.appendChild(slot);
    }
  }

  function createPieceElement(piece, index) {
    const minCellSize = 18;
    const minGap = 4;
    const minPadding = 12;
    const pieceEl = document.createElement("div");
    pieceEl.className = "piece";
    pieceEl.dataset.index = String(index);
    pieceEl.dataset.material = piece.material || selectedMaterialId();
    pieceEl.style.setProperty("--cols", String(piece.width));
    pieceEl.style.setProperty("--rows", String(piece.height));
    pieceEl.style.setProperty("--piece-color", piece.color);
    pieceEl.style.gridTemplateColumns = `repeat(${piece.width}, var(--piece-cell, 28px))`;
    pieceEl.style.gridTemplateRows = `repeat(${piece.height}, var(--piece-cell, 28px))`;
    pieceEl.style.minWidth = `${piece.width * minCellSize + Math.max(0, piece.width - 1) * minGap + minPadding}px`;
    pieceEl.style.minHeight = `${piece.height * minCellSize + Math.max(0, piece.height - 1) * minGap + minPadding}px`;

    const occupied = new Set(piece.cells.map((cell) => `${cell.x},${cell.y}`));
    for (let y = 0; y < piece.height; y += 1) {
      for (let x = 0; x < piece.width; x += 1) {
        const cell = document.createElement("span");
        cell.className = `piece-cell ${occupied.has(`${x},${y}`) ? "filled" : "empty"}`;
        cell.style.display = "block";
        cell.style.width = "var(--piece-cell, 28px)";
        cell.style.height = "var(--piece-cell, 28px)";
        cell.style.minWidth = `${minCellSize}px`;
        cell.style.minHeight = `${minCellSize}px`;
        if (occupied.has(`${x},${y}`)) {
          cell.style.backgroundColor = piece.color;
        }
        pieceEl.appendChild(cell);
      }
    }

    return pieceEl;
  }

  function startDrag(event, pieceIndex) {
    if (!state.running || state.paused || state.busy || state.gameOver) {
      return;
    }

    const piece = state.pieces[pieceIndex];
    if (!piece || piece.used) {
      return;
    }

    event.preventDefault();
    ensureAudio();

    const source = event.currentTarget;
    const sourceRect = source.getBoundingClientRect();
    const cellWidth = sourceRect.width / piece.width;
    const cellHeight = sourceRect.height / piece.height;
    const grabX = clamp(Math.floor((event.clientX - sourceRect.left) / cellWidth), 0, piece.width - 1);
    const grabY = clamp(Math.floor((event.clientY - sourceRect.top) / cellHeight), 0, piece.height - 1);
    const ghost = source.cloneNode(true);

    ghost.classList.add("drag-ghost");
    ghost.style.width = `${sourceRect.width}px`;
    ghost.style.height = `${sourceRect.height}px`;
    ghost.style.setProperty("--piece-color", piece.color);
    document.body.appendChild(ghost);
    source.classList.add("drag-source");
    if (source.setPointerCapture) {
      source.setPointerCapture(event.pointerId);
    }

    state.drag = {
      piece,
      pieceIndex,
      source,
      ghost,
      offsetX: event.clientX - sourceRect.left,
      offsetY: event.clientY - sourceRect.top,
      grabX,
      grabY,
      row: -1,
      col: -1,
      valid: false
    };

    moveDrag(event);
    window.addEventListener("pointermove", moveDrag, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", cancelDrag);
  }

  function moveDrag(event) {
    if (!state.drag) {
      return;
    }

    event.preventDefault();
    const drag = state.drag;
    drag.ghost.style.transform = `translate3d(${event.clientX - drag.offsetX}px, ${event.clientY - drag.offsetY}px, 0)`;

    const anchor = getBoardAnchor(event.clientX, event.clientY, drag);
    drag.row = anchor.row;
    drag.col = anchor.col;
    drag.valid = canPlacePiece(drag.piece, drag.row, drag.col);
    renderPreview(drag.piece, drag.row, drag.col, drag.valid);
  }

  function endDrag(event) {
    if (!state.drag) {
      return;
    }

    event.preventDefault();
    const drag = state.drag;
    const shouldPlace = drag.valid && !state.busy && !state.paused && state.running;
    const piece = drag.piece;
    const row = drag.row;
    const col = drag.col;

    clearDrag();

    if (shouldPlace) {
      placePiece(piece, drag.pieceIndex, row, col);
    } else {
      playSound("error");
    }
  }

  function cancelDrag() {
    clearDrag();
  }

  function clearDrag() {
    if (!state.drag) {
      clearPreview();
      return;
    }

    if (state.drag.source) {
      state.drag.source.classList.remove("drag-source");
    }
    if (state.drag.ghost) {
      state.drag.ghost.remove();
    }
    state.drag = null;
    clearPreview();
    window.removeEventListener("pointermove", moveDrag);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", cancelDrag);
  }

  function getBoardAnchor(clientX, clientY, drag) {
    const rect = dom.board.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const col = Math.floor(localX / (rect.width / BOARD_SIZE)) - drag.grabX;
    const row = Math.floor(localY / (rect.height / BOARD_SIZE)) - drag.grabY;
    return { row, col };
  }

  function renderPreview(piece, row, col, valid) {
    clearPreview();
    const previewClass = valid ? "preview-ok" : "preview-bad";

    piece.cells.forEach((cell) => {
      const targetRow = row + cell.y;
      const targetCol = col + cell.x;
      if (isInside(targetRow, targetCol)) {
        getCellEl(targetRow, targetCol).classList.add(previewClass);
      }
    });
  }

  function clearPreview() {
    cellEls.forEach((cell) => cell.classList.remove("preview-ok", "preview-bad"));
  }

  function placePiece(piece, pieceIndex, row, col) {
    if (!canPlacePiece(piece, row, col)) {
      playSound("error");
      return;
    }

    state.busy = true;
    clearPreview();

    const placedIndices = [];
    piece.cells.forEach((cell) => {
      const targetRow = row + cell.y;
      const targetCol = col + cell.x;
      state.board[targetRow][targetCol] = { color: piece.color, material: piece.material || selectedMaterialId() };
      placedIndices.push(indexFor(targetRow, targetCol));
    });
    if (placedIndices.includes(state.goldenBlockIndex)) {
      state.goldenBlockIndex = -1;
    }

    state.pieces[pieceIndex].used = true;
    save.totalBlocksPlaced += 1;
    syncBoard();
    animatePlacedCells(placedIndices);
    renderPieces();
    addScore(piece.cells.length * difficultyConfig().place, t("score.piece"), getBoardCenterPoint(placedIndices));
    playSound("place");

    const clearInfo = findFullLines();
    if (clearInfo.indices.length > 0) {
      handleLineClear(clearInfo);
    } else {
      finishTurn();
    }
  }

  function clearScoreLabel(clearInfo) {
    const lines = clearInfo.rows.length + clearInfo.cols.length;
    if (lines > 1) {
      return t("score.combo", { count: lines });
    }
    return clearInfo.rows.length > 0 ? t("score.row") : t("score.column");
  }

  function handleLineClear(clearInfo) {
    const lines = clearInfo.rows.length + clearInfo.cols.length;
    const config = difficultyConfig();
    const linePoints = lines * config.line;
    const clearedBlockPoints = clearInfo.indices.length * config.place * 2;
    const comboPoints = lines > 1 ? (lines - 1) * lines * config.combo : 0;
    const total = linePoints + clearedBlockPoints + comboPoints;
    const label = clearScoreLabel(clearInfo);

    save.totalLinesCleared += lines;
    save.bestCombo = Math.max(save.bestCombo, lines);
    state.linesThisGame += lines;
    saveGame();

    clearInfo.indices.forEach((index) => cellEls[index].classList.add("clearing"));
    spawnClearParticles(clearInfo.indices);
    addScore(total, label, getBoardCenterPoint(clearInfo.indices));
    showStatus(label);
    playSound(lines > 1 ? "combo" : "clear");

    window.setTimeout(() => {
      clearInfo.indices.forEach((index) => {
        const row = Math.floor(index / BOARD_SIZE);
        const col = index % BOARD_SIZE;
        state.board[row][col] = null;
        cellEls[index].classList.remove("clearing");
      });
      syncBoard();
      finishTurn();
      checkAchievements();
    }, CLEAR_DELAY);
  }

  function finishTurn() {
    if (state.pieces.length > 0 && state.pieces.every((piece) => piece.used)) {
      generatePieces();
    }

    state.busy = false;
    saveGame();
    updateAllStaticUi();
    checkAchievements();
    checkGameOver();
  }

  function canPlacePiece(piece, row, col) {
    return piece.cells.every((cell) => {
      const targetRow = row + cell.y;
      const targetCol = col + cell.x;
      return isInside(targetRow, targetCol) && state.board[targetRow][targetCol] === null;
    });
  }

  function canPieceFitAnywhere(piece) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (canPlacePiece(piece, row, col)) {
          return true;
        }
      }
    }
    return false;
  }

  function canShapeFitAnywhere(shape) {
    const piece = {
      cells: shape.cells.map(([x, y]) => ({ x, y }))
    };
    return canPieceFitAnywhere(piece);
  }

  function hasAnyMove() {
    return state.pieces.some((piece) => piece && !piece.used && canPieceFitAnywhere(piece));
  }

  function checkGameOver() {
    if (!state.running || state.busy || state.gameOver) {
      return;
    }

    if (!hasAnyMove()) {
      state.gameOver = true;
      state.running = false;
      state.paused = false;
      clearDrag();
      updateGameOverUi();
      openModal("gameOverModal");
      showStatus(t("status.gameOver"));
      playSound("gameover");
      checkAchievements();
    }
  }

  function findFullLines() {
    const rows = [];
    const cols = [];
    const indexSet = new Set();

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (state.board[row].every(Boolean)) {
        rows.push(row);
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          indexSet.add(indexFor(row, col));
        }
      }
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let full = true;
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        if (!state.board[row][col]) {
          full = false;
          break;
        }
      }
      if (full) {
        cols.push(col);
        for (let row = 0; row < BOARD_SIZE; row += 1) {
          indexSet.add(indexFor(row, col));
        }
      }
    }

    return { rows, cols, indices: [...indexSet] };
  }

  function syncBoard() {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const index = indexFor(row, col);
        const cell = cellEls[index];
        const block = state.board[row][col];
        cell.classList.toggle("filled", Boolean(block));
        if (block) {
          cell.style.setProperty("--cell-color", block.color);
          cell.dataset.material = block.material || "neon";
        } else {
          cell.style.removeProperty("--cell-color");
          delete cell.dataset.material;
        }
      }
    }
    syncGoldenBlock();
  }

  function animatePlacedCells(indices) {
    indices.forEach((index, offset) => {
      const cell = cellEls[index];
      window.setTimeout(() => {
        cell.classList.add("placed");
        window.setTimeout(() => cell.classList.remove("placed"), 280);
      }, offset * 22);
    });
  }

  function addScore(points, label, point) {
    if (!points) {
      return;
    }

    const previousScore = state.score;
    const previousHigh = save.highScore;
    state.score += points;
    awardCoinsForScoreMilestones(state.score);
    addJulyEventScore(points);
    save.highScore = Math.max(save.highScore, state.score);
    saveGame();

    animateNumber(dom.scoreValue, previousScore, state.score);
    animateNumber(dom.highScoreValue, previousHigh, save.highScore);
    pulseScoreCard();
    showScorePop(points, point, label);
    updateAllStaticUi();
    checkAchievements();
  }

  function awardCoinsForScoreMilestones(score) {
    const reachedMilestones = Math.floor(score / COIN_MILESTONE_STEP);
    const newMilestones = reachedMilestones - state.coinMilestonesAwarded;
    if (newMilestones <= 0) {
      return;
    }

    const coinsEarned = newMilestones * COINS_PER_MILESTONE;
    state.coinMilestonesAwarded = reachedMilestones;
    save.coins += coinsEarned;
    const reachedScore = reachedMilestones * COIN_MILESTONE_STEP;
    showToast(t("toast.coins"), t("toast.coinsEarned", {
      amount: formatNumber(coinsEarned),
      score: formatNumber(reachedScore)
    }));
    playSound("reward");
  }

  function animateNumber(element, from, to) {
    cancelAnimationFrame(element._countFrame || 0);
    const duration = 420;
    const start = performance.now();
    const easeOut = (value) => 1 - Math.pow(1 - value, 3);

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const value = from + (to - from) * easeOut(progress);
      element.textContent = formatNumber(value);

      if (progress < 1) {
        element._countFrame = requestAnimationFrame(tick);
      } else {
        element.textContent = formatNumber(to);
      }
    };

    element._countFrame = requestAnimationFrame(tick);
  }

  function pulseScoreCard() {
    const card = dom.scoreValue.closest(".score-card");
    card.classList.remove("score-bump");
    void card.offsetWidth;
    card.classList.add("score-bump");
    window.setTimeout(() => card.classList.remove("score-bump"), 220);
  }

  function showScorePop(points, point, label) {
    const fallback = dom.scoreValue.getBoundingClientRect();
    const x = point && typeof point.x === "number" ? point.x : fallback.left + fallback.width / 2;
    const y = point && typeof point.y === "number" ? point.y : fallback.top + fallback.height / 2;
    const pop = document.createElement("div");
    pop.className = "score-pop";
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    pop.textContent = `${label ? `${label} ` : ""}+${formatNumber(points)}`;
    dom.scorePopLayer.appendChild(pop);
    window.setTimeout(() => pop.remove(), 820);
  }

  function updateScoreDisplays(animated) {
    if (animated) {
      animateNumber(dom.scoreValue, 0, state.score);
      animateNumber(dom.highScoreValue, 0, save.highScore);
    } else {
      dom.scoreValue.textContent = formatNumber(state.score);
      dom.highScoreValue.textContent = formatNumber(save.highScore);
    }
  }

  function updateAllStaticUi() {
    applyTranslations();
    syncGoldenBlock();
    dom.difficultyBadge.textContent = t(`difficulty.${state.difficulty}.label`);
    dom.highScoreValue.textContent = formatNumber(save.highScore);
    if (dom.coinsValue) {
      dom.coinsValue.textContent = formatNumber(save.coins);
    }
    if (dom.walletCoinsValue) {
      dom.walletCoinsValue.textContent = formatNumber(save.coins);
    }
    if (dom.shopWalletCoinsValue) {
      dom.shopWalletCoinsValue.textContent = formatNumber(save.coins);
    }
    dom.menuBestScore.textContent = formatNumber(save.highScore);
    dom.menuDailyStreak.textContent = formatNumber(save.dailyStreak);
    updatePauseButton();
    updateSoundUi();
    updateSettingsUi();
    updateStatsUi();
    updateDailyUi();
    updateShopUi();
    updateJulyEventUi();
    updateUpdatesUi();
  }

  function updateMenuUi() {
    dom.playButton.textContent = state.running && !state.gameOver && state.paused ? t("top.resume") : t("menu.play");
    dom.menuBestScore.textContent = formatNumber(save.highScore);
    dom.menuDailyStreak.textContent = formatNumber(save.dailyStreak);
    const canClaim = canClaimDaily();
    dom.dailyButton.textContent = canClaim ? t("menu.dailyReady") : t("menu.dailyClaimed");
    updateEventButton();
  }

  function updateSettingsUi() {
    const activeDifficulty = save.settings.difficulty in DIFFICULTIES ? save.settings.difficulty : "normal";
    [...dom.difficultyControls.querySelectorAll("button")].forEach((button) => {
      button.classList.toggle("active", button.dataset.difficulty === activeDifficulty);
    });
    dom.difficultyHint.textContent = t(`difficulty.${activeDifficulty}.hint`);
    if (dom.languageSelect) {
      dom.languageSelect.value = currentLanguageCode();
    }
    if (dom.languageHint) {
      dom.languageHint.textContent = t("settings.languageHint");
    }
    if (dom.materialHint) {
      dom.materialHint.textContent = t("settings.materialHint");
    }
    updateSoundUi();
  }

  function updateShopUi() {
    if (dom.shopWalletCoinsValue) {
      dom.shopWalletCoinsValue.textContent = formatNumber(save.coins);
    }
    if (dom.shopMaterialHint) {
      dom.shopMaterialHint.textContent = t("settings.materialHint");
    }
    renderMaterialShop();
  }

  function updateSoundUi() {
    const enabled = Boolean(save.settings.sound);
    dom.muteButton.textContent = enabled ? t("top.soundOn") : t("top.soundOff");
    dom.muteButton.setAttribute("aria-pressed", String(enabled));
    if (dom.settingsSoundButton) {
      dom.settingsSoundButton.setAttribute("aria-pressed", String(enabled));
    }
    if (dom.soundHint) {
      dom.soundHint.textContent = enabled ? t("settings.soundOnHint") : t("settings.soundOffHint");
    }
  }

  function updateStatsUi() {
    dom.statHighScore.textContent = formatNumber(save.highScore);
    dom.statGamesPlayed.textContent = formatNumber(save.gamesPlayed);
    dom.statBlocksPlaced.textContent = formatNumber(save.totalBlocksPlaced);
    dom.statLinesCleared.textContent = formatNumber(save.totalLinesCleared);
  }

  function updateGameOverUi() {
    dom.gameOverScore.textContent = formatNumber(state.score);
    dom.gameOverBest.textContent = formatNumber(save.highScore);
    dom.gameOverLines.textContent = formatNumber(state.linesThisGame);
  }

  function materialShopTargets() {
    return [dom.materialShop, dom.shopMaterialShop].filter(Boolean);
  }

  function renderMaterialShop() {
    const targets = materialShopTargets();
    if (targets.length === 0) {
      return;
    }

    targets.forEach((target) => {
      target.innerHTML = "";

      BLOCK_MATERIALS.forEach((material) => {
        const owned = isMaterialOwned(material.id);
        const active = selectedMaterialId() === material.id;
        const canBuy = save.coins >= material.price;
        const card = document.createElement("button");
        card.type = "button";
        card.className = `material-card${owned ? " owned" : " locked"}${active ? " active" : ""}`;
        card.dataset.material = material.id;
        card.style.setProperty("--preview-color", material.preview);

        const status = active
          ? t("material.status.selected")
          : owned
            ? t("material.status.owned")
            : canBuy
              ? t("material.status.buy", { price: formatNumber(material.price) })
              : t("material.status.need", { price: formatNumber(material.price - save.coins) });

        card.innerHTML = `
          <span class="material-preview" data-material="${material.id}"></span>
          <span class="material-card-copy">
            <strong>${t(`material.${material.id}.name`)}</strong>
            <span>${t(`material.${material.id}.detail`)}</span>
          </span>
          <span class="material-card-status">${status}</span>
        `;
        target.appendChild(card);
      });
    });
  }

  function handleMaterialClick(event) {
    const card = event.target.closest("[data-material]");
    if (!card) {
      return;
    }

    const materialId = card.dataset.material;
    const material = BLOCK_MATERIALS.find((item) => item.id === materialId);
    if (!material) {
      return;
    }

    if (!isMaterialOwned(materialId)) {
      if (save.coins < material.price) {
        showToast(t("toast.notEnoughCoins"), t("material.status.need", { price: formatNumber(material.price - save.coins) }));
        playSound("error");
        return;
      }

      save.coins -= material.price;
      save.ownedMaterials.push(materialId);
      save.selectedMaterial = materialId;
      showToast(t("toast.materialBought"), t(`material.${materialId}.name`));
      playSound("reward");
    } else {
      save.selectedMaterial = materialId;
      showToast(t("toast.materialSelected"), t(`material.${materialId}.name`));
      playSound("tap");
    }

    applySelectedMaterialToGame();
    saveGame();
    updateAllStaticUi();
    renderPieces();
    syncBoard();
  }

  function applySelectedMaterialToGame() {
    const material = selectedMaterialId();
    state.pieces.forEach((piece) => {
      if (piece && !piece.used) {
        piece.material = material;
      }
    });
    state.board.forEach((row) => {
      row.forEach((block) => {
        if (block) {
          block.material = material;
        }
      });
    });
  }

  function handleDifficultyClick(event) {
    const button = event.target.closest("[data-difficulty]");
    if (!button) {
      return;
    }

    const difficulty = button.dataset.difficulty;
    if (!(difficulty in DIFFICULTIES)) {
      return;
    }

    save.settings.difficulty = difficulty;
    state.difficulty = difficulty;
    saveGame();
    updateAllStaticUi();
    showToast(t("toast.difficulty"), t(`difficulty.${difficulty}.label`));
    playSound("tap");
  }

  function handleLanguageChange(event) {
    const language = event.target.value;
    if (!Object.prototype.hasOwnProperty.call(I18N, language)) {
      return;
    }

    save.settings.language = language;
    saveGame();
    updateAllStaticUi();
    updateMenuUi();
    renderAchievements();
    showToast(t("toast.language"), languageMeta(language).name);
    playSound("tap");
  }

  function toggleSound() {
    save.settings.sound = !save.settings.sound;
    saveGame();
    updateSoundUi();
    if (save.settings.sound) {
      ensureAudio();
      playSound("tap");
    }
  }

  function renderAchievements() {
    dom.achievementList.innerHTML = "";
    ACHIEVEMENTS.forEach((achievement) => {
      const unlocked = Boolean(save.achievements[achievement.id]);
      const copy = achievementCopy(achievement.id);
      const item = document.createElement("div");
      item.className = `achievement-item${unlocked ? " unlocked" : ""}`;
      const status = unlocked ? t("achievements.unlocked", { date: save.achievements[achievement.id].date }) : copy.detail;
      item.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-copy">
          <strong>${copy.title}</strong>
          <span>${status}</span>
        </div>
      `;
      dom.achievementList.appendChild(item);
    });
  }

  function checkAchievements() {
    let changed = false;

    ACHIEVEMENTS.forEach((achievement) => {
      if (!save.achievements[achievement.id] && achievement.test(save)) {
        save.achievements[achievement.id] = { date: localDateKey() };
        changed = true;
        showToast(t("toast.achievement"), achievementCopy(achievement.id).title);
        playSound("achievement");
      }
    });

    if (changed) {
      saveGame();
      renderAchievements();
    }
  }

  function julyEventSave() {
    if (!save.events) {
      save.events = {};
    }
    if (!save.events[JULY_EVENT_ID]) {
      save.events[JULY_EVENT_ID] = { score: 0, claimedGoals: [], claimedAt: "" };
    }
    if (!Array.isArray(save.events[JULY_EVENT_ID].claimedGoals)) {
      save.events[JULY_EVENT_ID].claimedGoals = [];
    }
    return save.events[JULY_EVENT_ID];
  }

  function isJulyEventActive(date = new Date()) {
    return date >= JULY_EVENT_START && date < JULY_EVENT_END;
  }

  function isGoldenBlockFeatureActive(date = new Date()) {
    return isJulyEventActive(date);
  }

  function randomGoldenBlockIndex() {
    if (!isGoldenBlockFeatureActive()) {
      return -1;
    }

    const emptyIndices = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (!state.board[row][col]) {
          emptyIndices.push(indexFor(row, col));
        }
      }
    }

    return emptyIndices.length > 0 ? randomFrom(emptyIndices) : -1;
  }

  function spawnGoldenBlock() {
    state.goldenBlockIndex = randomGoldenBlockIndex();
    syncGoldenBlock();
  }

  function syncGoldenBlock() {
    cellEls.forEach((cell, index) => {
      const row = Math.floor(index / BOARD_SIZE);
      const col = index % BOARD_SIZE;
      const isGolden = index === state.goldenBlockIndex
        && isGoldenBlockFeatureActive()
        && state.board[row][col] === null;

      cell.classList.toggle("golden-bonus", isGolden);
      cell.tabIndex = isGolden ? 0 : -1;
      if (isGolden) {
        cell.setAttribute("aria-label", t("toast.goldenBlock"));
      } else {
        cell.removeAttribute("aria-label");
      }
    });
  }

  function handleGoldenBlockClick(event) {
    const cell = event.target.closest(".cell.golden-bonus");
    if (!cell || !dom.board.contains(cell)) {
      return;
    }

    claimGoldenBlock(Number(cell.dataset.index));
  }

  function handleGoldenBlockKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const cell = event.target.closest(".cell.golden-bonus");
    if (!cell || !dom.board.contains(cell)) {
      return;
    }

    event.preventDefault();
    claimGoldenBlock(Number(cell.dataset.index));
  }

  function claimGoldenBlock(index) {
    if (
      index !== state.goldenBlockIndex
      || !state.running
      || state.paused
      || state.busy
      || state.gameOver
      || !isGoldenBlockFeatureActive()
    ) {
      return;
    }

    state.goldenBlockIndex = -1;
    save.coins += GOLDEN_BLOCK_REWARD;
    saveGame();
    syncGoldenBlock();
    updateAllStaticUi();
    showToast(t("toast.goldenBlock"), t("toast.goldenBlockReward", {
      amount: formatNumber(GOLDEN_BLOCK_REWARD)
    }));
    showScorePop(GOLDEN_BLOCK_REWARD, getBoardCenterPoint([index]), t("toast.coins"));
    spawnClearParticles([index], "#ffd166");
    playSound("reward");
  }

  function isJulyEventUpcoming(date = new Date()) {
    return date < JULY_EVENT_START;
  }

  function isJulyEventEnded(date = new Date()) {
    return date >= JULY_EVENT_END;
  }

  function formatEventDuration(ms) {
    const totalMinutes = Math.max(0, Math.floor(ms / 60000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const compact = currentLanguageCode() === "ru" || currentLanguageCode() === "uk";

    if (days > 0) {
      return compact ? `${days} д ${hours} ч` : `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return compact ? `${hours} ч ${minutes} мин` : `${hours}h ${minutes}m`;
    }
    return compact ? `${minutes} мин` : `${minutes}m`;
  }

  function updateJulyEventTimerUi() {
    if (!dom.julyEventStatus || !dom.julyEventTimer) {
      return;
    }

    const now = new Date();
    if (isJulyEventUpcoming(now)) {
      dom.julyEventStatus.textContent = t("event.statusSoon");
      dom.julyEventTimer.textContent = t("event.timerStarts", { time: formatEventDuration(JULY_EVENT_START - now) });
    } else if (isJulyEventEnded(now)) {
      dom.julyEventStatus.textContent = t("event.statusEnded");
      dom.julyEventTimer.textContent = t("event.timerEnded");
    } else {
      dom.julyEventStatus.textContent = t("event.statusActive");
      dom.julyEventTimer.textContent = t("event.timerEnds", { time: formatEventDuration(JULY_EVENT_END - now) });
    }
  }

  function startJulyEventTicker() {
    if (julyEventTicker) {
      return;
    }
    updateJulyEventTimerUi();
    julyEventTicker = window.setInterval(() => {
      updateJulyEventTimerUi();
      updateEventButton();
    }, 1000);
  }

  function updateUpdatesUi() {
    if (!dom.nextUpdateStatus || !dom.nextUpdateTimer || !dom.nextUpdateDate) {
      return;
    }

    const now = new Date();
    dom.nextUpdateDate.textContent = t("updates.dateValue");
    if (now < NEXT_UPDATE_AT) {
      dom.nextUpdateStatus.textContent = t("updates.statusSoon");
      dom.nextUpdateTimer.textContent = t("updates.timerSoon", { time: formatEventDuration(NEXT_UPDATE_AT - now) });
    } else {
      dom.nextUpdateStatus.textContent = t("updates.statusReleased");
      dom.nextUpdateTimer.textContent = t("updates.timerReleased");
    }
  }

  function startUpdatesTicker() {
    if (updatesTicker) {
      return;
    }
    updateUpdatesUi();
    updatesTicker = window.setInterval(updateUpdatesUi, 1000);
  }

  function availableJulyEventGoals(goalScore = null) {
    const eventSave = julyEventSave();
    return JULY_EVENT_GOALS.filter((goal) => {
      const matchesGoal = goalScore === null || goal.score === goalScore;
      return matchesGoal && eventSave.score >= goal.score && !eventSave.claimedGoals.includes(goal.score);
    });
  }

  function updateEventButton() {
    if (!dom.eventButton) {
      return;
    }
    dom.eventButton.textContent = isJulyEventActive() && availableJulyEventGoals().length > 0 ? t("menu.eventReady") : t("menu.event");
  }

  function addJulyEventScore(points) {
    if (!points || !isJulyEventActive()) {
      return;
    }

    const eventSave = julyEventSave();
    const previousScore = eventSave.score;
    eventSave.score += Math.max(0, Math.round(points));
    const reachedGoals = JULY_EVENT_GOALS.filter((goal) => previousScore < goal.score && eventSave.score >= goal.score);

    if (reachedGoals.length > 0) {
      const latestGoal = reachedGoals[reachedGoals.length - 1];
      showToast(t("toast.event"), t("event.goalReached", { score: formatNumber(latestGoal.score) }));
      playSound("achievement");
    }
  }

  function updateJulyEventUi() {
    if (!dom.julyEventProgressBar || !dom.julyEventGoals || !dom.julyEventGoalText || !dom.julyEventProgressText || !dom.julyEventReward || !dom.claimJulyEventButton) {
      updateEventButton();
      return;
    }

    const eventSave = julyEventSave();
    const displayScore = Math.min(eventSave.score, JULY_EVENT_MAX_GOAL);
    const progress = JULY_EVENT_MAX_GOAL > 0 ? displayScore / JULY_EVENT_MAX_GOAL * 100 : 0;
    const totalReward = JULY_EVENT_GOALS.reduce((sum, goal) => sum + goal.reward, 0);
    const canClaimAny = availableJulyEventGoals().length > 0 && isJulyEventActive();

    updateJulyEventTimerUi();
    dom.julyEventGoalText.textContent = t("event.goalText");
    dom.julyEventProgressBar.style.width = `${Math.min(100, progress)}%`;
    dom.julyEventProgressText.textContent = `${formatNumber(displayScore)} / ${formatNumber(JULY_EVENT_MAX_GOAL)}`;
    dom.julyEventReward.textContent = t("event.reward", { amount: formatNumber(totalReward) });
    dom.claimJulyEventButton.disabled = !canClaimAny;
    dom.claimJulyEventButton.textContent = canClaimAny ? t("event.claimAll") : t("event.noRewards");
    renderJulyEventGoals();
    updateEventButton();
  }

  function renderJulyEventGoals() {
    const eventSave = julyEventSave();
    dom.julyEventGoals.innerHTML = "";

    JULY_EVENT_GOALS.forEach((goal) => {
      const reached = eventSave.score >= goal.score;
      const claimed = eventSave.claimedGoals.includes(goal.score);
      const claimable = reached && !claimed && isJulyEventActive();
      const item = document.createElement("div");
      item.className = `event-goal${reached ? " reached" : ""}${claimed ? " claimed" : ""}`;

      const buttonText = claimed
        ? t("event.claimed")
        : claimable
          ? t("event.claim")
          : reached && isJulyEventEnded()
            ? t("event.statusEnded")
            : isJulyEventUpcoming()
              ? t("event.statusSoon")
              : t("event.locked", { score: formatNumber(goal.score) });

      item.innerHTML = `
        <div>
          <strong>${formatNumber(goal.score)}</strong>
          <span>${t("event.reward", { amount: formatNumber(goal.reward) })}</span>
        </div>
        <button type="button" data-event-goal="${goal.score}" ${claimable ? "" : "disabled"}>${buttonText}</button>
      `;
      dom.julyEventGoals.appendChild(item);
    });
  }

  function handleJulyEventGoalClick(event) {
    const button = event.target.closest("[data-event-goal]");
    if (!button) {
      return;
    }
    claimJulyEventRewards(Number(button.dataset.eventGoal));
  }

  function claimJulyEventRewards(goalScore = null) {
    if (!isJulyEventActive()) {
      playSound("error");
      updateJulyEventUi();
      return;
    }

    const eventSave = julyEventSave();
    const goals = availableJulyEventGoals(goalScore);
    if (goals.length === 0) {
      playSound("error");
      updateJulyEventUi();
      return;
    }

    const reward = goals.reduce((sum, goal) => sum + goal.reward, 0);
    goals.forEach((goal) => {
      eventSave.claimedGoals.push(goal.score);
    });
    eventSave.claimedGoals = [...new Set(eventSave.claimedGoals)];
    eventSave.claimedAt = localDateKey();
    save.coins += reward;
    saveGame();
    showToast(t("toast.event"), t("event.rewardToast", { amount: formatNumber(reward) }));
    playSound("reward");
    updateAllStaticUi();
  }

  function canClaimDaily() {
    return save.lastDailyClaim !== localDateKey();
  }

  function previewDailyStreak() {
    if (!canClaimDaily()) {
      return save.dailyStreak;
    }
    return save.lastDailyClaim === localDateKey(-1) ? save.dailyStreak + 1 : 1;
  }

  function dailyRewardAmount() {
    return 200 + Math.min(previewDailyStreak(), 7) * 50;
  }

  function updateDailyUi() {
    const canClaim = canClaimDaily();
    const amount = dailyRewardAmount();
    dom.dailyTitle.textContent = canClaim ? t("daily.ready") : t("daily.claimed");
    dom.dailyRewardAmount.textContent = `+${formatNumber(amount)}`;
    dom.dailyStreakValue.textContent = formatNumber(save.dailyStreak);
    dom.dailyBankedValue.textContent = formatNumber(save.dailyBonusBank);
    dom.claimDailyButton.disabled = !canClaim;
    dom.claimDailyButton.textContent = canClaim ? t("daily.claim") : t("daily.claimedButton");
  }

  function claimDailyReward() {
    if (!canClaimDaily()) {
      playSound("error");
      return;
    }

    const today = localDateKey();
    const streak = save.lastDailyClaim === localDateKey(-1) ? save.dailyStreak + 1 : 1;
    const amount = 200 + Math.min(streak, 7) * 50;

    save.lastDailyClaim = today;
    save.dailyStreak = streak;
    save.dailyBonusBank += amount;
    saveGame();
    showToast(t("toast.dailyReward"), t("toast.dailyBanked", { amount: formatNumber(amount) }));
    playSound("reward");
    updateAllStaticUi();
    checkAchievements();

    if (state.running && !state.gameOver) {
      applyBankedDailyBonus();
    }
  }

  function applyBankedDailyBonus() {
    if (!state.running || state.gameOver || save.dailyBonusBank <= 0) {
      return;
    }

    const bonus = save.dailyBonusBank;
    save.dailyBonusBank = 0;
    saveGame();
    addScore(bonus, t("score.bonus"), null);
    showStatus(t("status.dailyBonus"));
    updateAllStaticUi();
  }

  function showToast(title, message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
    dom.toastStack.appendChild(toast);
    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      window.setTimeout(() => toast.remove(), 180);
    }, 2600);
  }

  function showStatus(text) {
    dom.statusRibbon.textContent = text;
    dom.statusRibbon.classList.add("show");
    clearTimeout(dom.statusRibbon._timer);
    dom.statusRibbon._timer = window.setTimeout(() => {
      dom.statusRibbon.classList.remove("show");
    }, 1200);
  }

  function resizeParticleCanvas() {
    if (!dom.particleCanvas || !canvasContext) {
      return;
    }

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    dom.particleCanvas.width = Math.floor(window.innerWidth * dpr);
    dom.particleCanvas.height = Math.floor(window.innerHeight * dpr);
    canvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnClearParticles(indices, colorOverride = "") {
    if (!canvasContext) {
      return;
    }

    indices.forEach((index) => {
      const cell = cellEls[index];
      const rect = cell.getBoundingClientRect();
      const block = state.board[Math.floor(index / BOARD_SIZE)][index % BOARD_SIZE];
      const color = colorOverride || (block && block.color ? block.color : randomFrom(COLORS));
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      for (let i = 0; i < 5; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.4 + Math.random() * 4.2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: 2 + Math.random() * 4,
          life: 520 + Math.random() * 260,
          maxLife: 780,
          color,
          spin: (Math.random() - 0.5) * 0.18,
          rotation: Math.random() * Math.PI
        });
      }
    });

    if (!particleFrame) {
      lastParticleTime = performance.now();
      particleFrame = requestAnimationFrame(tickParticles);
    }
  }

  function tickParticles(now) {
    if (!canvasContext) {
      particleFrame = 0;
      return;
    }

    const delta = Math.min(32, now - lastParticleTime || 16);
    lastParticleTime = now;
    canvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles = particles.filter((particle) => {
      particle.life -= delta;
      if (particle.life <= 0) {
        return false;
      }

      particle.vy += 0.06 * delta / 16;
      particle.x += particle.vx * delta / 16;
      particle.y += particle.vy * delta / 16;
      particle.rotation += particle.spin * delta / 16;
      const alpha = Math.max(0, particle.life / particle.maxLife);

      canvasContext.save();
      canvasContext.globalAlpha = alpha;
      canvasContext.translate(particle.x, particle.y);
      canvasContext.rotate(particle.rotation);
      canvasContext.fillStyle = particle.color;
      canvasContext.shadowBlur = 16;
      canvasContext.shadowColor = particle.color;
      canvasContext.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      canvasContext.restore();
      return true;
    });

    if (particles.length > 0) {
      particleFrame = requestAnimationFrame(tickParticles);
    } else {
      particleFrame = 0;
      canvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function ensureAudio() {
    if (!save.settings.sound) {
      return null;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioCtor();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    return audioContext;
  }

  function playSound(type) {
    if (!save.settings.sound) {
      return;
    }

    const context = ensureAudio();
    if (!context) {
      return;
    }

    const now = context.currentTime;
    const patterns = {
      tap: [[420, 0, 0.05, "sine", 0.025]],
      start: [[330, 0, 0.08, "triangle", 0.035], [520, 0.08, 0.08, "triangle", 0.035]],
      place: [[380, 0, 0.055, "triangle", 0.03], [590, 0.055, 0.07, "triangle", 0.025]],
      clear: [[520, 0, 0.06, "sine", 0.034], [720, 0.06, 0.08, "sine", 0.032], [940, 0.13, 0.09, "sine", 0.03]],
      combo: [[420, 0, 0.05, "square", 0.025], [640, 0.06, 0.06, "square", 0.025], [880, 0.12, 0.08, "square", 0.022], [1160, 0.2, 0.11, "triangle", 0.026]],
      reward: [[470, 0, 0.08, "sine", 0.035], [705, 0.09, 0.08, "sine", 0.035], [940, 0.18, 0.12, "sine", 0.03]],
      achievement: [[660, 0, 0.08, "triangle", 0.03], [990, 0.09, 0.1, "triangle", 0.03]],
      gameover: [[250, 0, 0.14, "sawtooth", 0.025], [180, 0.14, 0.18, "sawtooth", 0.02]],
      error: [[180, 0, 0.08, "square", 0.018]]
    };

    (patterns[type] || patterns.tap).forEach(([frequency, delay, duration, wave, volume]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(volume, now + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + duration + 0.02);
    });
  }

  function getBoardCenterPoint(indices) {
    if (!indices || indices.length === 0) {
      return null;
    }

    const rects = indices.map((index) => cellEls[index].getBoundingClientRect());
    const x = rects.reduce((sum, rect) => sum + rect.left + rect.width / 2, 0) / rects.length;
    const y = rects.reduce((sum, rect) => sum + rect.top + rect.height / 2, 0) / rects.length;
    return { x, y };
  }

  function isInside(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  function indexFor(row, col) {
    return row * BOARD_SIZE + col;
  }

  function getCellEl(row, col) {
    return cellEls[indexFor(row, col)];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  init();
})();
