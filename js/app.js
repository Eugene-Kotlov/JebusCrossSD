/* Драфт Соломона — веб-версия python/main.py.
 *
 * Поле: две цветные зоны (красная слева, синяя справа) и серая зона общих
 * карт между ними. Настройки нового расклада открываются кнопкой
 * «Новый расклад». Управление: ЛКМ — выбрать/переложить карту, перетаскивание
 * мышью, ПКМ — увеличенный просмотр карты до повторного ПКМ/левого клика/Esc.
 *
 * Сеть: MQTT через WebSocket к публичному брокеру. Топик и формат сообщений
 * совпадают с Python-версией: jebus-draft/<комната>/chat, JSON с kind
 * "chat" / "sync" / "sync_req". Синхронизация поля — пара (rev, origin).
 */
(function () {
  "use strict";

  // --- ОСНОВНЫЕ НАСТРОЙКИ ---
  var HOTA_CASTLES = [
    "Замок (Castle)",
    "Оплот (Rampart)",
    "Башня (Tower)",
    "Инферно (Inferno)",
    "Некрополис (Necropolis)",
    "Темница (Dungeon)",
    "Цитадель (Stronghold)",
    "Крепость (Fortress)",
    "Сопряжение (Conflux)",
    "Причал (Cove)",
    "Фабрика (Factory)",
    "Кронверк (Bulwark)"
  ];

  var MAX_INDIVIDUAL = 9;
  var MAX_SHARED = 3;
  var CARDS_PER_DRAFT = MAX_INDIVIDUAL;
  var SHARED_CARDS = MAX_SHARED;
  var CARD_SCALE = 1.0;
  var START_GOLD = 10000;
  var TOTAL_GOLD = 20000;
  var CASTLE_ART_ASPECT = 800 / 374;
  var CASTLE_ART_HEIGHT = 0.28;

  var MQTT_HOST = "broker.emqx.io";
  var MQTT_WS_URL = "wss://" + MQTT_HOST + ":8084/mqtt";
  var MQTT_PREFIX = "jebus-draft";
  var MONEY_SYNC_MS = 250;

  var COLOR_FILL = { "Красный": "#ff7a6e", "Синий": "#74b9ff" };
  var COLOR_WORD = { "Красный": "красная", "Синий": "синяя" };
  var COLOR_ACC = { "Красный": "красную", "Синий": "синюю" };

  var SHARED_TITLE_H = 30;
  var SHARED_PAD = 8;
  var SHARED_GAP = 20;
  var PICK_SPACE = 62;
  var ZONE_RADIUS = 14;
  var DRAG_THRESHOLD = 6;
  var CONSOLE_LIMIT = 400;

  var INDIVIDUAL = "individual";
  var SHARED = "shared";

  // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  // Кегль зависит от обоих измерений карты: на маленьких картах текст
  // остаётся читаемым, на увеличенной копии — занимает больше места.
  function cardFontRange(width, height, title) {
    var shortSide = Math.min(width, height);
    if (title) {
      return [
        clamp(Math.round(width * 0.105 + shortSide * 0.025), 8, 30),
        clamp(Math.round(width * 0.048), 6, 12)
      ];
    }
    return [
      clamp(Math.round(width * 0.070 + shortSide * 0.018), 7, 22),
      clamp(Math.round(width * 0.042), 5, 10)
    ];
  }

  function randInt(low, high) {
    return low + Math.floor(Math.random() * (high - low + 1));
  }

  function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function uuidHex() {
    if (window.crypto && window.crypto.getRandomValues) {
      var bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.prototype.map.call(bytes, function (byte) {
        return byte.toString(16).padStart(2, "0");
      }).join("");
    }
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function stableStringify(value) {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return "[" + value.map(stableStringify).join(",") + "]";
    }
    return "{" + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ":" + stableStringify(value[key]);
    }).join(",") + "}";
  }

  function toInteger(value) {
    if (typeof value === "number" && Number.isInteger(value)) {
      return value;
    }
    if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
      return parseInt(value, 10);
    }
    throw new Error("bad integer");
  }

  function fmtGold(value) {
    return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
  }

  function roomSlug(room) {
    var slug = String(room || "").trim().toLowerCase()
      .replace(/[^\p{L}\p{N}_-]+/gu, "-")
      .replace(/^-+|-+$/g, "");
    return slug.slice(0, 32) || "general";
  }

  function imageFile(name) {
    var manifest = window.IMG_MANIFEST || [];
    var lower = String(name || "").toLowerCase();
    for (var i = 0; i < manifest.length; i++) {
      if (manifest[i].toLowerCase() === lower) {
        return manifest[i];
      }
    }
    return String(name || "");
  }

  function imageSrc(name) {
    return "img/" + encodeURIComponent(imageFile(name));
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    return node;
  }

  function setPos(node, x, y, width, height) {
    node.style.left = Math.round(x) + "px";
    node.style.top = Math.round(y) + "px";
    node.style.width = Math.round(width) + "px";
    node.style.height = Math.round(height) + "px";
  }

  function closestFrom(target, selector) {
    var node = target;
    if (!node || node.nodeType !== 1) {
      node = node && node.parentElement;
    }
    return node ? node.closest(selector) : null;
  }

  // --- КАРТЫ ---

  function cardMutexGroup(raw) {
    var value = parseInt(raw && raw.mutex_group, 10);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  function cardType(raw) {
    var value = raw.type;
    if (value === undefined || value === null) {
      value = raw.kind;
    }
    value = String(value === undefined || value === null ? "" : value).trim().toLowerCase();
    return (value === SHARED || value === "общая") ? SHARED : INDIVIDUAL;
  }

  function normalizeCard(raw) {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      var shortText = String(raw.short || "");
      return {
        mutex_group: cardMutexGroup(raw),
        name: (String(raw.name || "").trim() || "Карта").slice(0, 60),
        image: String(raw.image || ""),
        type: cardType(raw),
        short: shortText.slice(0, 300),
        long: String(raw.long || shortText).slice(0, 600),
        template: window.TemplateTool.normalizeTemplate(raw.template)
      };
    }
    if (Array.isArray(raw) && raw.length === 2) {
      var desc = String(raw[1] || "");
      return {
        mutex_group: 0,
        name: desc.slice(0, 60),
        image: "",
        type: INDIVIDUAL,
        short: desc.slice(0, 300),
        long: desc.slice(0, 600),
        template: []
      };
    }
    throw new Error("bad card");
  }

  // --- ЗАГРУЗКА ДАННЫХ ---
  // Все данные встроены в js/data.js: набор карт и шаблон в base64.
  // Сетевые запросы не нужны и не делаются — работает и по file://.

  function loadDeckRaw() {
    return Array.isArray(window.CARD_DECK_RAW) ? window.CARD_DECK_RAW : [];
  }

  function loadTemplateText() {
    if (window.TEMPLATE_B64) {
      return window.TemplateTool.decodeCp1251(
        window.TemplateTool.base64ToBytes(window.TEMPLATE_B64)
      );
    }
    throw new Error("Не найден шаблон в js/data.js");
  }

  // --- ПРИЛОЖЕНИЕ ---

  class DraftApp {
    constructor(deck, templateText) {
      this.deck = deck;
      this.templateText = templateText || "";

      this.roundNo = 0;
      this.cards = [];
      this.zones = { left: [], right: [] };
      this.shared = [];
      this.indTotal = CARDS_PER_DRAFT;
      this.sharedTotal = SHARED_CARDS;
      this.selected = null;
      this.picked = null;
      this.phase = "idle";

      this.splitterId = null;
      this.splitterName = "";
      this.chooserId = null;
      this.chooserName = "";
      this.sessionId = uuidHex();

      this.templateSavedKey = null;
      this.templateBlobUrl = null;
      this.templateFileName = "";

      this.money = { left: START_GOLD, right: TOTAL_GOLD - START_GOLD };
      this.moneyGuard = false;
      this.moneyPublishJob = null;
      this.castleSelected = null;
      this.setups = {
        left: { color: "Красный", castle: HOTA_CASTLES[0], money: this.money.left },
        right: { color: "Синий", castle: HOTA_CASTLES[1], money: this.money.right }
      };

      this.press = null;
      this.hoverZone = null;
      this.zoomActive = false;
      this.zoomCardIndex = null;
      this.touchZoomTimer = null;
      this.cardSize = [0, 0];
      this.plaqueWh = [300, 140];
      this.zoneClientRects = {};
      this.cardRects = [];
      this.fitCache = new Map();
      this.pendingFits = [];
      this.imageInfo = {};
      this.lastBoardSize = [0, 0];
      this.resizeRaf = null;
      this.goldPanels = {};
      this.draftDialog = null;

      this.net = null;
      this.netRoom = null;
      this.netName = "Игрок";
      this.netId = uuidHex();
      this.netConnected = false;
      this.boardRev = 0;
      this.boardOrigin = this.netId;
      this.boardSig = null;
      this.applyingSync = false;
      this.netServed = {};
      this.netSynced = false;

      this.buildUi();
      this.bindEvents();
      this.resetBoard();
      this.preloadImages();

      window.addEventListener("beforeunload", () => {
        this.disconnectMqtt();
      });
    }

    buildUi() {
      this.board = document.getElementById("board");
      this.infoEl = document.getElementById("info");
      this.consoleEl = document.getElementById("console");
      this.ghostLayer = document.getElementById("ghost-layer");
      this.zoomLayer = document.getElementById("zoom-layer");

      this.nameInput = document.getElementById("net-name");
      this.roomInput = document.getElementById("net-room");
      this.netStatusEl = document.getElementById("net-status");
      this.btnConnect = document.getElementById("btn-connect");
      this.chatInput = document.getElementById("chat-input");
      this.btnSend = document.getElementById("btn-send");
      this.btnCoin = document.getElementById("btn-coin");
      this.btnDone = document.getElementById("btn-done");
      this.btnNew = document.getElementById("btn-new");
      this.btnTemplate = document.getElementById("btn-template");

      this.draftModal = document.getElementById("draft-modal");
      this.indInput = document.getElementById("ind-count");
      this.sharedInput = document.getElementById("shared-count");
      this.draftTotalEl = document.getElementById("draft-total");
      this.btnDraftCreate = document.getElementById("draft-create");
      this.btnDraftCancel = document.getElementById("draft-cancel");

      var self = this;
      ["left", "right"].forEach(function (side) {
        self.goldPanels[side] = self.createGoldPanel(side);
      });

      this.zoomLayer.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        self.hideZoom();
      });
    }

    // --- ЗОЛОТО ---

    createGoldPanel(side) {
      var self = this;
      var panel = el("div", "gold-panel");
      var meta = el("div", "gold-meta");
      var label = el("span", "gold-label");
      label.textContent = "ЗОЛОТО";
      var delta = el("span", "gold-delta");
      delta.textContent = "±0";
      var input = document.createElement("input");
      input.type = "number";
      input.className = "gold-input";
      input.min = "0";
      input.max = String(TOTAL_GOLD);
      input.step = "100";
      input.value = String(this.money[side]);
      input.setAttribute("aria-label", "Золото");
      input.addEventListener("input", function () {
        self.onMoneyEdit(side);
      });
      input.addEventListener("change", function () {
        self.normalizeMoney(side);
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          self.normalizeMoney(side);
          input.blur();
        }
      });
      meta.append(label, delta);
      panel.append(meta, input);
      return { panel: panel, delta: delta, input: input };
    }

    moneyValue(side) {
      var raw = String(this.goldPanels[side].input.value || "")
        .replace(/[\s\u2009]/g, "");
      var value = parseInt(raw, 10);
      if (!Number.isFinite(value)) {
        value = this.money[side];
      }
      return clamp(value, 0, TOTAL_GOLD);
    }

    onMoneyEdit(side) {
      if (this.moneyGuard) {
        return;
      }
      this.setMoney(side, this.moneyValue(side), false, false);
    }

    normalizeMoney(side) {
      this.setMoney(side, this.moneyValue(side), true, true);
    }

    setMoney(side, value, syncEdited, publish) {
      value = clamp(Math.trunc(value), 0, TOTAL_GOLD);
      var other = side === "left" ? "right" : "left";
      var rest = TOTAL_GOLD - value;
      this.money[side] = value;
      this.money[other] = rest;
      this.setups[side].money = value;
      this.setups[other].money = rest;

      this.moneyGuard = true;
      var panel = this.goldPanels[side];
      var otherPanel = this.goldPanels[other];
      if (syncEdited !== false && panel.input.value !== String(value)) {
        panel.input.value = String(value);
      }
      if (otherPanel.input.value !== String(rest)) {
        otherPanel.input.value = String(rest);
      }
      this.moneyGuard = false;

      this.updateMoneyMarks();
      if (publish === false) {
        this.scheduleMoneyPublish();
      } else {
        this.cancelMoneyPublish();
        this.publishBoard();
      }
    }

    moneyDelta(side) {
      return Math.trunc(this.setups[side].money) - START_GOLD;
    }

    updateMoneyMarks() {
      var self = this;
      ["left", "right"].forEach(function (side) {
        var panel = self.goldPanels[side];
        if (!panel) {
          return;
        }
        var change = self.moneyDelta(side);
        var text = "±0";
        var extra = "";
        if (change > 0) {
          text = "+" + change;
          extra = " positive";
        } else if (change < 0) {
          text = String(change);
          extra = " negative";
        }
        panel.delta.textContent = text;
        panel.delta.className = "gold-delta" + extra;
      });
    }

    updateGoldPanel(side) {
      var panel = this.goldPanels[side];
      if (!panel) {
        return;
      }
      var value = String(this.money[side]);
      if (panel.input.value !== value) {
        panel.input.value = value;
      }
      panel.input.disabled = !this.canMoveCards();
      panel.panel.style.setProperty(
        "--side-color", COLOR_FILL[this.setups[side].color] || "#8a5a1f"
      );
      this.updateMoneyMarks();
    }

    scheduleMoneyPublish() {
      this.cancelMoneyPublish();
      var self = this;
      this.moneyPublishJob = window.setTimeout(function () {
        self.moneyPublishJob = null;
        self.publishBoard();
      }, MONEY_SYNC_MS);
    }

    cancelMoneyPublish() {
      if (this.moneyPublishJob !== null) {
        window.clearTimeout(this.moneyPublishJob);
        this.moneyPublishJob = null;
      }
    }

    syncMoneyVars() {
      this.moneyGuard = true;
      for (var side of ["left", "right"]) {
        var panel = this.goldPanels[side];
        if (panel.input.value !== String(this.money[side])) {
          panel.input.value = String(this.money[side]);
        }
      }
      this.moneyGuard = false;
      this.updateMoneyMarks();
    }

    // --- СОБЫТИЯ И РАЗМЕР ---

    bindEvents() {
      var self = this;

      this.btnNew.addEventListener("click", function () { self.askNewDraft(); });
      this.btnDone.addEventListener("click", function () { self.confirmSplit(); });
      this.btnTemplate.addEventListener("click", function () { self.downloadTemplate(); });
      this.btnConnect.addEventListener("click", function () { self.toggleConnection(); });
      this.btnSend.addEventListener("click", function () { self.sendChat(); });
      this.btnCoin.addEventListener("click", function () { self.flipCoin(); });

      this.chatInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          self.sendChat();
        }
      });
      this.nameInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          self.roomInput.focus();
        }
      });
      this.roomInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          self.toggleConnection();
        }
      });

      this.board.addEventListener("pointerdown", function (event) {
        self.onPointerDown(event);
      });
      this.board.addEventListener("pointermove", function (event) {
        self.onPointerMove(event);
      });
      this.board.addEventListener("pointerup", function (event) {
        self.onPointerUp(event);
      });
      this.board.addEventListener("pointercancel", function (event) {
        self.onPointerCancel(event);
      });
      this.board.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        self.startZoom(event);
      });

      // Увеличение закрепляется до левого клика / Esc / ПКМ по самой карте.
      window.addEventListener("pointerdown", function (event) {
        if (event.button === 0 && self.zoomActive) {
          self.hideZoom();
        }
      }, true);
      window.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          self.zoomActive = false;
          self.hideZoom();
          self.closeDraftDialog();
        }
      });

      this.indInput.addEventListener("input", function () { self.updateDraftTotal(); });
      this.sharedInput.addEventListener("input", function () { self.updateDraftTotal(); });
      this.btnDraftCreate.addEventListener("click", function () { self.createDraftFromDialog(); });
      this.btnDraftCancel.addEventListener("click", function () { self.closeDraftDialog(); });
      this.draftModal.addEventListener("pointerdown", function (event) {
        if (event.target === self.draftModal) {
          self.closeDraftDialog();
        }
      });
      this.draftModal.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          self.createDraftFromDialog();
        } else if (event.key === "Escape") {
          event.preventDefault();
          self.closeDraftDialog();
        }
      });

      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(function () {
          self.onBoardResize();
        });
        this.resizeObserver.observe(this.board);
      }
      window.addEventListener("resize", function () {
        self.onBoardResize();
      });
    }

    onBoardResize() {
      var width = this.board.clientWidth;
      var height = this.board.clientHeight;
      if (width === this.lastBoardSize[0] && height === this.lastBoardSize[1]) {
        return;
      }
      this.scheduleRedraw();
    }

    scheduleRedraw() {
      if (this.resizeRaf !== null) {
        return;
      }
      var self = this;
      this.resizeRaf = window.requestAnimationFrame(function () {
        self.resizeRaf = null;
        self.redraw();
      });
    }

    preloadImages() {
      var self = this;
      var names = new Set();
      this.deck.forEach(function (card) {
        if (card.image) {
          names.add(card.image);
        }
      });
      var tasks = [];
      names.forEach(function (name) {
        tasks.push(new Promise(function (resolve) {
          var image = new Image();
          image.onload = function () {
            self.imageInfo[name] = {
              w: image.naturalWidth,
              h: image.naturalHeight
            };
            resolve();
          };
          image.onerror = function () {
            self.imageInfo[name] = null;
            resolve();
          };
          image.src = imageSrc(name);
        }));
      });
      return Promise.all(tasks).then(function () {
        if (self.phase !== "idle") {
          self.redraw();
        }
      });
    }

    // --- ГЕОМЕТРИЯ ПОЛЯ ---

    plaqueBox(zoneW, zoneH) {
      var width = zoneW - 28;
      var height = width / CASTLE_ART_ASPECT;
      var limit = zoneH * CASTLE_ART_HEIGHT;
      if (height > limit) {
        height = limit;
        width = height * CASTLE_ART_ASPECT;
      }
      return { w: Math.round(width), h: Math.round(height) };
    }

    layoutMetrics(width, height) {
      var margin = 14;
      var zoneGap = SHARED_GAP;
      var zonesY = 12 + 4;
      var zonesBottom = height - 10;
      var zoneH = zonesBottom - zonesY;
      var indN = this.indTotal;
      var sharedN = this.shared.length;
      var hasShared = sharedN > 0;
      var best = null;
      var cw;
      var ch;
      var gap;

      for (cw = 140; cw > 45; cw--) {
        ch = Math.floor(cw * 1.4);
        gap = Math.max(5, Math.floor(cw * 0.09));
        var centerW = hasShared ? cw + 2 * SHARED_PAD : 0;
        var gaps = hasShared ? 2 * zoneGap : zoneGap;
        var zoneW = (width - 2 * margin - gaps - centerW) / 2;
        if (zoneW < cw * 2.6) {
          continue;
        }
        var plaque = this.plaqueBox(zoneW, zoneH);
        var top = 40 + plaque.h + 10;
        var avail = zoneH - top - 8 - PICK_SPACE;
        var cols = Math.max(1, Math.floor((zoneW - 16 + gap) / (cw + gap)));
        var rows = indN ? Math.ceil(indN / cols) : 0;
        var need = rows * ch + Math.max(0, rows - 1) * gap;
        var centerH = hasShared
          ? SHARED_TITLE_H + sharedN * ch + Math.max(0, sharedN - 1) * gap + 2 * SHARED_PAD
          : 0;
        if (need <= avail && centerH <= zoneH) {
          best = {
            cw: cw, ch: ch, gap: gap, zoneW: zoneW,
            centerW: centerW, centerH: centerH, plaque: plaque
          };
          break;
        }
      }

      if (!best) {
        cw = 46;
        ch = 64;
        gap = 5;
        var centerW2 = hasShared ? cw + 2 * SHARED_PAD : 0;
        var gaps2 = hasShared ? 2 * zoneGap : zoneGap;
        var zoneW2 = (width - 2 * margin - gaps2 - centerW2) / 2;
        var centerH2 = hasShared
          ? SHARED_TITLE_H + sharedN * ch + Math.max(0, sharedN - 1) * gap + 2 * SHARED_PAD
          : 0;
        best = {
          cw: cw, ch: ch, gap: gap, zoneW: zoneW2,
          centerW: centerW2, centerH: centerH2,
          plaque: this.plaqueBox(zoneW2, zoneH)
        };
      }

      var zoneW3 = best.zoneW;
      var centerX = 0;
      var centerY = 0;
      var rightX;
      if (hasShared) {
        centerX = margin + zoneW3 + zoneGap;
        rightX = centerX + best.centerW + zoneGap;
        centerY = zonesY + (zoneH - best.centerH) / 2;
      } else {
        rightX = margin + zoneW3 + zoneGap;
      }

      return {
        margin: margin,
        y: zonesY,
        bottom: zonesBottom,
        leftX: margin,
        rightX: rightX,
        zoneH: zoneH,
        zoneW: zoneW3,
        centerW: best.centerW,
        centerH: best.centerH,
        centerX: centerX,
        centerY: centerY,
        cw: Math.round(best.cw * CARD_SCALE),
        ch: Math.round(best.ch * CARD_SCALE),
        gap: best.gap,
        plaqueW: best.plaque.w,
        plaqueH: best.plaque.h,
        hasShared: hasShared
      };
    }

    // --- РИСОВАНИЕ ---

    redraw() {
      this.hideZoom();
      this.zoomActive = false;
      this.board.innerHTML = "";
      this.ghostLayer.innerHTML = "";
      this.zoneClientRects = {};
      this.cardRects = [];
      this.hoverZone = null;

      var width = this.board.clientWidth;
      var height = this.board.clientHeight;
      this.lastBoardSize = [width, height];
      if (width < 40 || height < 40) {
        return;
      }
      if (this.phase === "idle") {
        this.drawEmpty();
        return;
      }

      var metrics = this.layoutMetrics(width, height);
      this.plaqueWh = [metrics.plaqueW, metrics.plaqueH];
      this.cardSize = [metrics.cw, metrics.ch];

      this.drawZone("left", metrics.leftX, metrics.y, metrics.zoneW,
        metrics.zoneH, metrics.cw, metrics.ch, metrics.gap);
      if (metrics.hasShared) {
        this.drawSharedZone(metrics.centerX, metrics.centerY, metrics.centerW,
          metrics.centerH, metrics.cw, metrics.ch, metrics.gap);
      }
      this.drawZone("right", metrics.rightX, metrics.y, metrics.zoneW,
        metrics.zoneH, metrics.cw, metrics.ch, metrics.gap);
      this.flushFits();
    }

    drawEmpty() {
      var wrap = el("div", "board-empty");
      var title = el("div", "board-empty-title");
      title.textContent = "Новый расклад ещё не создан";
      var hint = el("div", "board-empty-hint");
      hint.textContent = "Нажмите «Новый расклад»";
      wrap.append(title, hint);
      this.board.append(wrap);
    }

    drawZone(side, x, y, zoneW, zoneH, cw, ch, gap) {
      var setup = this.setups[side];
      var chosen = this.picked === side;
      var zone = el("div", "zone " + (side === "left" ? "zone-red" : "zone-blue") +
        (chosen ? " chosen" : ""));
      zone.dataset.zoneSide = side;
      setPos(zone, x, y, zoneW, zoneH);

      var title = el("div", "zone-title");
      title.textContent = setup.color.toUpperCase();
      zone.append(title);

      var gold = this.goldPanels[side];
      zone.append(gold.panel);
      this.updateGoldPanel(side);

      this.appendCastle(zone, side, zoneW / 2, 40 + this.plaqueWh[1] / 2);

      var cards = this.zones[side];
      var picking = this.phase === "choosing";

      if (!cards.length) {
        var hint = el("div", "zone-hint");
        hint.textContent = (this.phase === "splitting" && this.indTotal)
          ? "перетащите карту сюда"
          : "без карт";
        hint.style.top = Math.round(zoneH / 2 + 26) + "px";
        zone.append(hint);
      } else {
        var cols = Math.max(1, Math.floor((zoneW - 16 + gap) / (cw + gap)));
        cols = Math.min(cols, cards.length);
        var rows = Math.ceil(cards.length / cols);
        var gridW = cols * cw + (cols - 1) * gap;
        var gridH = rows * ch + (rows - 1) * gap;
        var gridX = Math.round((zoneW - gridW) / 2);
        var top = 40 + this.plaqueWh[1] + 10;
        var avail = zoneH - (picking ? PICK_SPACE : 8) - top;
        var gridY = Math.round(top + Math.max(0, (avail - gridH) / 2));

        for (var i = 0; i < cards.length; i++) {
          var row = Math.floor(i / cols);
          var col = i % cols;
          var cardX = gridX + col * (cw + gap);
          var cardY = gridY + row * (ch + gap);
          var index = cards[i];
          this.createCardFace(zone, {
            x: cardX, y: cardY, w: cw, h: ch,
            card: this.cards[index], index: index, zone: side,
            highlight: this.selected === index,
            textKey: "short"
          });
        }
      }

      if (picking) {
        this.appendPickButton(zone, side, zoneW, zoneH);
      }

      this.board.append(zone);
      this.zoneClientRects[side] = zone.getBoundingClientRect();
      this.recordCardRects(zone);
    }

    drawSharedZone(x, y, zoneW, zoneH, cw, ch, gap) {
      var zone = el("div", "zone zone-shared");
      setPos(zone, x, y, zoneW, zoneH);

      var title = el("div", "zone-title");
      title.textContent = "ОБЩИЕ";
      title.style.left = "0";
      title.style.right = "0";
      title.style.textAlign = "center";
      zone.append(title);

      var cardX = Math.round((zoneW - cw) / 2);
      var top = SHARED_TITLE_H + SHARED_PAD;
      for (var i = 0; i < this.shared.length; i++) {
        var index = this.shared[i];
        this.createCardFace(zone, {
          x: cardX, y: Math.round(top + i * (ch + gap)), w: cw, h: ch,
          card: this.cards[index], index: index, shared: true,
          textKey: "short"
        });
      }

      this.board.append(zone);
      this.zoneClientRects.shared = zone.getBoundingClientRect();
      this.recordCardRects(zone);
    }

    appendCastle(zone, side, centerX, centerY) {
      var setup = this.setups[side];
      var width = this.plaqueWh[0];
      var height = this.plaqueWh[1];
      var plaque = el("div", "castle-plaque");
      plaque.dataset.castleSide = side;
      if (this.castleSelected === side) {
        plaque.classList.add("selected");
      }
      setPos(plaque, centerX - width / 2, centerY - height / 2, width, height);
      plaque.style.borderRadius = Math.max(8, Math.floor(height / 14)) + "px";

      var name = setup.castle || "Замок";
      var image = document.createElement("img");
      image.alt = name;
      image.draggable = false;
      image.src = imageSrc(this.castleArtFile(name));
      image.addEventListener("error", function () {
        image.remove();
        plaque.classList.add("no-art");
      });

      var band = el("div", "castle-band");
      var label = document.createElement("span");
      label.textContent = name;
      band.style.fontSize = Math.max(9, Math.round(height * 0.152)) + "px";
      band.append(label);

      plaque.append(image, band);
      zone.append(plaque);
    }

    castleArtFile(name) {
      var source = String(name || "");
      var bracket = source.lastIndexOf("(");
      var latin = (bracket >= 0 ? source.slice(bracket + 1) : source)
        .replace(/^[ )]+/, "")
        .replace(/[ )]+$/, "");
      return latin + ".jpg";
    }

    appendPickButton(zone, side, zoneW, zoneH) {
      var setup = this.setups[side];
      var active = this.canChoose();
      var width = Math.min(Math.max(180, Math.round(zoneW - 56)), 340);
      var height = 42;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "pick-btn" + (active ? " active" : "");
      button.dataset.pickSide = side;
      button.disabled = !active;
      button.textContent = "Выбрать " +
        (COLOR_ACC[setup.color] || "выбранную") + " сторону";
      setPos(button, (zoneW - width) / 2, zoneH - 12 - height, width, height);
      zone.append(button);
    }

    recordCardRects(zone) {
      var self = this;
      var faces = zone.querySelectorAll(".card-face[data-card-index]");
      for (var i = 0; i < faces.length; i++) {
        var face = faces[i];
        var index = parseInt(face.dataset.cardIndex, 10);
        if (!Number.isFinite(index) || !self.cards[index]) {
          continue;
        }
        var rect = face.getBoundingClientRect();
        self.cardRects.push({
          index: index,
          card: self.cards[index],
          rect: {
            left: rect.left, top: rect.top,
            right: rect.right, bottom: rect.bottom,
            width: rect.width, height: rect.height
          }
        });
      }
    }

    createCardFace(parent, options) {
      var width = Math.round(options.w);
      var height = Math.round(options.h);
      if (width < 2 || height < 2) {
        return null;
      }
      var card = options.card;
      var face = el("div", "card-face" +
        (options.highlight ? " highlight" : "") +
        (options.zoom ? " zoomed" : ""));
      setPos(face, options.x, options.y, width, height);
      var radius = Math.max(5, Math.floor(width / 11));
      face.style.borderRadius = radius + "px";

      if (!options.ghost) {
        face.dataset.cardIndex = String(options.index);
        if (options.shared) {
          face.dataset.sharedIndex = String(options.index);
        } else {
          face.dataset.zone = options.zone;
        }
      }

      var pad = Math.max(4, Math.round(width * 0.05));
      var titleH = Math.round(height * 0.18);
      var titleTop = Math.round(height * 0.02);
      var title = el("div", "card-title");
      setPos(title, pad, titleTop, width - 2 * pad, titleH);
      var titleSpan = document.createElement("span");
      titleSpan.textContent = card.name || "Карта";
      title.append(titleSpan);
      face.append(title);

      var artTop = titleH + Math.round(height * 0.03);
      var artWidth = width - 2 * pad;
      var innerBottom = height - pad;
      var textMinH = Math.max(10, Math.round(height * 0.22));
      var maxArtH = Math.max(1, innerBottom - artTop - textMinH);
      var info = card.image ? this.imageInfo[card.image] : null;
      var drawWidth = artWidth;
      var artHeight;
      if (info && info.w > 0 && info.h > 0) {
        artHeight = Math.max(1, Math.round(artWidth * info.h / info.w));
        if (artHeight > maxArtH) {
          artHeight = maxArtH;
          drawWidth = Math.max(1, Math.round(artHeight * info.w / info.h));
        }
      } else {
        artHeight = Math.max(1, Math.min(maxArtH, Math.round(height * 0.38)));
      }

      var art = el("div", "card-art" + (info ? "" : " empty"));
      setPos(art, (width - drawWidth) / 2, artTop, drawWidth, artHeight);
      art.style.borderRadius = Math.max(3, radius - 3) + "px";
      if (info && card.image) {
        var image = document.createElement("img");
        image.alt = card.name || "";
        image.draggable = false;
        image.src = imageSrc(card.image);
        image.addEventListener("error", function () {
          image.remove();
          art.classList.add("empty");
        });
        art.append(image);
      }
      face.append(art);

      var lineTop = artTop + artHeight + 2;
      var divider = el("div", "card-divider");
      setPos(divider, pad, lineTop, width - 2 * pad, 1);
      face.append(divider);

      var textTop = lineTop + 2;
      var textHeight = Math.max(1, innerBottom - textTop);
      var body = card[options.textKey] || card.short || "";
      var text = el("div", "card-text");
      setPos(text, pad, textTop, width - 2 * pad, textHeight);
      var bodySpan = document.createElement("span");
      bodySpan.textContent = body;
      text.append(bodySpan);
      face.append(text);

      parent.append(face);

      this.queueFit(face, width, height, !!body);
      return face;
    }

    // Зоны собираются до вставки в DOM: размеры текста ещё равны нулю.
    // Поэтому подбор кегля откладывается до подключения карты к документу.
    queueFit(face, width, height, hasBody) {
      var task = { face: face, width: width, height: height, hasBody: hasBody };
      if (face.isConnected) {
        this.applyFit(task);
      } else {
        this.pendingFits.push(task);
      }
    }

    applyFit(task) {
      var title = task.face.querySelector(".card-title");
      var titleRange = cardFontRange(task.width, task.height, true);
      if (title) {
        this.fitText(title, titleRange[0], titleRange[1]);
      }
      if (task.hasBody) {
        var text = task.face.querySelector(".card-text");
        var bodyRange = cardFontRange(task.width, task.height, false);
        if (text) {
          this.fitText(text, bodyRange[0], bodyRange[1]);
        }
      }
    }

    flushFits() {
      var tasks = this.pendingFits;
      this.pendingFits = [];
      for (var i = 0; i < tasks.length; i++) {
        this.applyFit(tasks[i]);
      }
    }

    fitText(box, maxSize, minSize) {
      var span = box.firstElementChild;
      if (!span) {
        return;
      }
      var boxW = box.clientWidth;
      var boxH = box.clientHeight;
      var full = String(span.textContent || "");
      if (boxW <= 0 || boxH <= 0 || !full.trim()) {
        return;
      }
      span.style.display = "block";
      span.style.whiteSpace = "pre-wrap";
      span.style.wordBreak = "break-word";
      span.style.overflow = "hidden";

      var key = [full, boxW, boxH, maxSize, minSize].join("\u0001");
      var fitted = this.fitCache.get(key);
      if (!fitted) {
        var size = Math.max(1, Math.round(maxSize));
        var floor = Math.max(1, Math.min(Math.round(minSize), size));
        var fits = function () {
          return span.scrollHeight <= boxH + 1 &&
            span.scrollWidth <= boxW + 1;
        };
        span.textContent = full;
        span.style.fontSize = size + "px";
        while (size > floor && !fits()) {
          size--;
          span.style.fontSize = size + "px";
        }
        var shown = full;
        if (!fits()) {
          // Даже минимальный кегль не вмещается — обрезаем с многоточием.
          var low = 0;
          var high = full.length;
          while (low < high) {
            var mid = Math.ceil((low + high) / 2);
            span.textContent = full.slice(0, mid).trimEnd() + "\u2026";
            if (fits()) {
              low = mid;
            } else {
              high = mid - 1;
            }
          }
          shown = full.slice(0, low).trimEnd() + "\u2026";
        }
        fitted = { size: size, text: shown };
        if (this.fitCache.size > 400) {
          this.fitCache.clear();
        }
        this.fitCache.set(key, fitted);
      }
      span.textContent = fitted.text;
      span.style.fontSize = fitted.size + "px";
    }

    // --- ПОИСК ЦЕЛИ И ПЕРЕТАСКИВАНИЕ ---

    findTarget(from) {
      var shared = closestFrom(from, "[data-shared-index]");
      if (shared) {
        return { kind: "shared_card", index: parseInt(shared.dataset.sharedIndex, 10) };
      }
      var card = closestFrom(from, "[data-card-index]");
      if (card) {
        return {
          kind: "zone_card",
          side: card.dataset.zone,
          index: parseInt(card.dataset.cardIndex, 10)
        };
      }
      var pick = closestFrom(from, "[data-pick-side]");
      if (pick) {
        return { kind: "pick", side: pick.dataset.pickSide };
      }
      var castle = closestFrom(from, "[data-castle-side]");
      if (castle) {
        return { kind: "castle", side: castle.dataset.castleSide };
      }
      var zone = closestFrom(from, "[data-zone-side]");
      if (zone) {
        return { kind: "zone", side: zone.dataset.zoneSide };
      }
      return null;
    }

    dropZoneAt(clientX, clientY) {
      for (var side of ["left", "right"]) {
        var rect = this.zoneClientRects[side];
        if (!rect) {
          continue;
        }
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
          return side;
        }
      }
      return null;
    }

    cardAtClient(clientX, clientY) {
      for (var i = this.cardRects.length - 1; i >= 0; i--) {
        var rect = this.cardRects[i].rect;
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
          return this.cardRects[i];
        }
      }
      return null;
    }

    onPointerDown(event) {
      if (event.button === 2) {
        // Показ увеличения делаем в contextmenu: он срабатывает даже при
        // коротком правом клике и не закрывается сразу после pointerup.
        return;
      }
      if (event.button !== 0 || this.zoomActive) {
        return;
      }
      var pick = closestFrom(event.target, "[data-pick-side]");
      if (pick) {
        if (this.phase === "choosing") {
          this.pickSide(pick.dataset.pickSide);
        }
        return;
      }
      if (closestFrom(event.target, "input, button, textarea, select")) {
        return;
      }
      event.preventDefault();
      this.press = null;
      var target = this.findTarget(event.target);
      if (!target) {
        return;
      }
      if (target.kind === "shared_card") {
        if (this.selected !== null) {
          this.selected = null;
          this.refresh();
        }
        return;
      }
      if (this.phase === "choosing") {
        return;
      }
      if (!this.canMoveCards()) {
        return;
      }
      this.press = {
        target: target,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        ghost: false,
        card: null,
        ghostEl: null,
        hiddenEl: null,
        ox: 0,
        oy: 0,
        pointerId: event.pointerId
      };
      try {
        this.board.setPointerCapture(event.pointerId);
      } catch (err) {
        /* некоторые браузеры не дают захват — не критично */
      }
      if (event.pointerType === "touch") {
        this.startTouchZoom(event, target);
      }
    }

    onPointerMove(event) {
      if (this.zoomActive) {
        return;
      }
      var state = this.press;
      if (!state) {
        return;
      }
      if (!state.ghost) {
        if (Math.abs(event.clientX - state.x) < DRAG_THRESHOLD &&
            Math.abs(event.clientY - state.y) < DRAG_THRESHOLD) {
          return;
        }
        if (state.target.kind === "zone") {
          return;
        }
        if (!this.beginDrag(state, event)) {
          this.press = null;
          return;
        }
      }
      this.moveGhost(event.clientX, event.clientY);
      this.highlightDrop(this.dropZoneAt(event.clientX, event.clientY));
    }

    onPointerUp(event) {
      this.cancelTouchZoom();
      var state = this.press;
      if (!state) {
        return;
      }
      this.press = null;
      try {
        this.board.releasePointerCapture(event.pointerId);
      } catch (err) {
        /* pointer уже отпущен */
      }
      if (state.ghost) {
        var card = state.card;
        var side = this.dropZoneAt(event.clientX, event.clientY);
        this.clearGhost();
        this.finishDrag(card, side);
        return;
      }
      var target = state.target;
      if (target.kind === "castle") {
        this.clickCastle(target.side);
      } else if (target.kind === "zone_card") {
        this.clickZoneCard(target.side, target.index);
      } else if (target.kind === "zone") {
        this.clickZone(target.side);
      }
    }

    onPointerCancel() {
      this.cancelTouchZoom();
      this.press = null;
      this.clearGhost();
      this.refresh();
    }

    beginDrag(state, event) {
      var target = state.target;
      this.cancelTouchZoom();
      this.ghostLayer.innerHTML = "";

      if (target.kind === "castle") {
        var plaque = this.board.querySelector(
          '.castle-plaque[data-castle-side="' + target.side + '"]'
        );
        if (!plaque) {
          return false;
        }
        var rect = plaque.getBoundingClientRect();
        state.ox = event.clientX - rect.left;
        state.oy = event.clientY - rect.top;
        var clone = plaque.cloneNode(true);
        clone.classList.remove("selected", "dragging");
        clone.style.width = rect.width + "px";
        clone.style.height = rect.height + "px";
        this.ghostLayer.append(clone);
        plaque.classList.add("dragging");
        state.ghost = true;
        state.ghostEl = clone;
        state.hiddenEl = plaque;
        state.card = { kind: "castle", side: target.side };
        this.moveGhost(event.clientX, event.clientY);
        return true;
      }

      if (target.kind === "zone_card") {
        var index = target.index;
        var cardEl = this.board.querySelector(
          '.card-face[data-zone="' + target.side + '"][data-card-index="' + index + '"]'
        );
        if (!cardEl || !this.cards[index]) {
          return false;
        }
        var cw = this.cardSize[0];
        var ch = this.cardSize[1];
        var cardRect = cardEl.getBoundingClientRect();
        state.ox = event.clientX - cardRect.left;
        state.oy = event.clientY - cardRect.top;
        if (state.ox < 0 || state.ox > cw || state.oy < 0 || state.oy > ch) {
          state.ox = cw / 2;
          state.oy = ch / 2;
        }
        var ghost = this.createCardFace(this.ghostLayer, {
          x: 0, y: 0, w: cw, h: ch, card: this.cards[index],
          index: index, ghost: true, highlight: true, textKey: "short"
        });
        cardEl.classList.add("dragging");
        state.ghost = true;
        state.ghostEl = ghost;
        state.hiddenEl = cardEl;
        state.card = { kind: "zone_card", side: target.side, index: index };
        this.moveGhost(event.clientX, event.clientY);
        return true;
      }

      return false;
    }

    moveGhost(clientX, clientY) {
      var state = this.press;
      if (!state || !state.ghostEl) {
        return;
      }
      state.ghostEl.style.left = Math.round(clientX - state.ox) + "px";
      state.ghostEl.style.top = Math.round(clientY - state.oy) + "px";
    }

    highlightDrop(side) {
      if (side === this.hoverZone) {
        return;
      }
      this.hoverZone = side;
      var zones = this.board.querySelectorAll(".zone[data-zone-side]");
      for (var i = 0; i < zones.length; i++) {
        zones[i].classList.toggle(
          "drop-active", zones[i].dataset.zoneSide === side
        );
      }
    }

    clearGhost() {
      this.ghostLayer.innerHTML = "";
      this.hoverZone = null;
      var hidden = this.board.querySelectorAll(".dragging");
      for (var i = 0; i < hidden.length; i++) {
        hidden[i].classList.remove("dragging");
      }
      var active = this.board.querySelectorAll(".drop-active");
      for (var j = 0; j < active.length; j++) {
        active[j].classList.remove("drop-active");
      }
    }

    finishDrag(card, side) {
      if (!this.canMoveCards() || !card) {
        this.refresh();
        return;
      }
      if (card.kind === "castle") {
        if (side && side !== card.side) {
          this.swapCastles(card.side, side);
        }
      } else {
        var src = card.side;
        var index = card.index;
        if (side && side !== src) {
          this.zones[src] = this.zones[src].filter(function (item) {
            return item !== index;
          });
          this.zones[side].push(index);
        }
        this.selected = null;
      }
      this.refresh();
    }

    // --- КЛИКИ ---

    clickCastle(side) {
      if (!this.canMoveCards()) {
        return;
      }
      if (this.castleSelected === side) {
        this.castleSelected = null;
      } else if (this.castleSelected === null) {
        this.castleSelected = side;
      } else {
        var other = this.castleSelected;
        this.castleSelected = null;
        this.swapCastles(other, side);
      }
      this.refresh();
    }

    swapCastles(first, second) {
      if (first === second) {
        return;
      }
      var tmp = this.setups[first].castle;
      this.setups[first].castle = this.setups[second].castle;
      this.setups[second].castle = tmp;
    }

    zoneOf(index) {
      for (var side of ["left", "right"]) {
        if (this.zones[side].indexOf(index) !== -1) {
          return side;
        }
      }
      return null;
    }

    clickZone(side) {
      if (!this.canMoveCards() || this.selected === null) {
        return;
      }
      var src = this.zoneOf(this.selected);
      if (src && src !== side) {
        this.zones[src] = this.zones[src].filter((item) => item !== this.selected);
        this.zones[side].push(this.selected);
      }
      this.selected = null;
      this.refresh();
    }

    clickZoneCard(side, index) {
      if (!this.canMoveCards()) {
        return;
      }
      if (this.selected !== null && this.selected !== index) {
        var src = this.zoneOf(this.selected);
        if (src && src !== side) {
          var moving = this.selected;
          this.zones[src] = this.zones[src].filter(function (item) {
            return item !== moving;
          });
          this.zones[side].push(moving);
          this.selected = null;
          this.refresh();
          return;
        }
      }
      this.selected = this.selected === index ? null : index;
      this.refresh();
    }

    // --- УВЕЛИЧЕНИЕ КАРТЫ ---

    cardIndexFromTarget(target) {
      if (!target) {
        return null;
      }
      if (target.kind === "zone_card" || target.kind === "shared_card") {
        return target.index;
      }
      return null;
    }

    startZoom(event) {
      this.cancelTouchZoom();
      this.zoomActive = true;
      var info = this.cardAtClient(event.clientX, event.clientY);
      var index = info ? info.index
        : this.cardIndexFromTarget(this.findTarget(event.target));
      if (index !== null && this.cards[index]) {
        this.showZoom(index, event.clientX, event.clientY);
      } else {
        this.hideZoom();
      }
    }

    onZoomMove(event) {
      var info = this.cardAtClient(event.clientX, event.clientY);
      if (!info) {
        if (!this.zoomLayer.hidden) {
          this.hideZoom();
        }
      } else if (info.index !== this.zoomCardIndex) {
        this.showZoom(info.index, event.clientX, event.clientY);
      }
    }

    startTouchZoom(event, target) {
      if (!target || (target.kind !== "zone_card" && target.kind !== "shared_card")) {
        return;
      }
      var info = this.cardAtClient(event.clientX, event.clientY);
      if (!info) {
        return;
      }
      var self = this;
      this.cancelTouchZoom();
      this.touchZoomTimer = window.setTimeout(function () {
        self.touchZoomTimer = null;
        self.press = null;
        self.zoomActive = true;
        self.showZoom(info.index, event.clientX, event.clientY);
      }, 450);
    }

    cancelTouchZoom() {
      if (this.touchZoomTimer !== null) {
        window.clearTimeout(this.touchZoomTimer);
        this.touchZoomTimer = null;
      }
    }

    showZoom(index, pointerX, pointerY) {
      var card = this.cards[index];
      var cw = this.cardSize[0];
      var ch = this.cardSize[1];
      if (!card || cw <= 0 || ch <= 0) {
        return;
      }
      var viewWidth = window.innerWidth;
      var viewHeight = window.innerHeight;
      // Половина высоты экрана: карта целиком видна, long-текст читается.
      var zoomH = Math.max(1, Math.round(viewHeight * 0.5));
      var zoomW = Math.max(1, Math.round(zoomH * cw / ch));
      if (zoomW > viewWidth - 24) {
        zoomW = Math.max(1, viewWidth - 24);
        zoomH = Math.max(1, Math.round(zoomW * ch / cw));
      }
      var x = Math.min(Math.max(pointerX - zoomW / 2, 12),
        Math.max(12, viewWidth - zoomW - 12));
      var y = Math.min(Math.max(pointerY - zoomH / 2, 12),
        Math.max(12, viewHeight - zoomH - 12));

      this.zoomLayer.innerHTML = "";
      this.zoomLayer.hidden = false;
      this.createCardFace(this.zoomLayer, {
        x: x, y: y, w: zoomW, h: zoomH, card: card,
        index: index, ghost: true, highlight: true, zoom: true,
        textKey: "long"
      });
      this.zoomCardIndex = index;
    }

    hideZoom() {
      this.zoomActive = false;
      if (!this.zoomLayer) {
        return;
      }
      this.zoomLayer.hidden = true;
      this.zoomLayer.innerHTML = "";
      this.zoomCardIndex = null;
    }

    // --- РОЛИ И ХОД ---

    isSplitter() {
      return this.phase !== "idle" && this.splitterId === this.netId;
    }

    isChooser() {
      if (this.phase === "idle") {
        return false;
      }
      if (this.chooserId) {
        return this.chooserId === this.netId;
      }
      return this.splitterId !== this.netId;
    }

    canMoveCards() {
      return this.phase === "splitting" && this.isSplitter();
    }

    canChoose() {
      if (this.phase !== "choosing") {
        return false;
      }
      if (this.chooserId) {
        return this.chooserId === this.netId;
      }
      if (this.splitterId !== this.netId) {
        return true;
      }
      return !this.netReady();
    }

    shortName(name) {
      var text = String(name || "").trim() || "Игрок";
      return text.length <= 12 ? text : text.slice(0, 11) + "…";
    }

    myName() {
      var name = String(this.nameInput.value || "").trim() || this.netName || "Игрок";
      return name.slice(0, 24);
    }

    roleName(role) {
      var name = role === "splitter" ? this.splitterName : this.chooserName;
      return this.shortName(name);
    }

    // --- ХОД ДРАФТА ---

    resetBoard() {
      this.phase = "idle";
      this.picked = null;
      this.selected = null;
      this.castleSelected = null;
      this.cards = [];
      this.zones = { left: [], right: [] };
      this.shared = [];
      this.splitterId = null;
      this.splitterName = "";
      this.chooserId = null;
      this.chooserName = "";
      this.setups = {
        left: { color: "Красный", castle: "", money: this.money.left },
        right: { color: "Синий", castle: "", money: this.money.right }
      };
      this.syncMoneyVars();
      this.refresh();
    }

    newDraft(individual, shared) {
      individual = individual === undefined ? CARDS_PER_DRAFT : Math.trunc(individual);
      shared = shared === undefined ? SHARED_CARDS : Math.trunc(shared);
      individual = clamp(individual, 0, MAX_INDIVIDUAL);
      shared = clamp(shared, 0, MAX_SHARED);
      this.indTotal = individual;
      this.sharedTotal = shared;

      this.roundNo += 1;
      this.phase = "splitting";
      this.picked = null;
      this.selected = null;
      this.castleSelected = null;
      this.zones = { left: [], right: [] };
      if (!this.splitterId) {
        this.splitterId = this.netId;
        this.splitterName = this.myName();
      }

      this.cards = this.draftCards(individual, shared);
      this.shared = [];
      for (var i = individual; i < this.cards.length; i++) {
        this.shared.push(i);
      }

      var castles = shuffle(HOTA_CASTLES.slice()).slice(0, 2);
      this.setups = {
        left: { color: "Красный", castle: castles[0], money: this.money.left },
        right: { color: "Синий", castle: castles[1], money: this.money.right }
      };
      this.syncMoneyVars();
      this.dealCards();
      this.refresh();
    }

    draftCards(individual, shared) {
      var pool = this.deck.map(function (card) {
        return normalizeCard(card);
      });
      if (!pool.length) {
        return [];
      }
      shuffle(pool);
      var indPool = pool.filter(function (card) {
        return card.type !== SHARED;
      });
      var shPool = pool.filter(function (card) {
        return card.type === SHARED;
      });
      var usedGroups = new Set();

      function takeUnique(cards, need) {
        var out = [];
        for (var i = 0; i < cards.length && out.length < need; i++) {
          var card = cards[i];
          var group = cardMutexGroup(card);
          if (group && usedGroups.has(group)) {
            continue;
          }
          out.push(card);
          if (group) {
            usedGroups.add(group);
          }
        }
        return out;
      }

      var pickedInd = takeUnique(indPool, individual);
      var pickedSh = takeUnique(shPool, shared);

      function takeRest(need) {
        var out = [];
        for (var i = 0; i < pool.length && out.length < need; i++) {
          var card = pool[i];
          var group = cardMutexGroup(card);
          if (pickedInd.indexOf(card) === -1 &&
              pickedSh.indexOf(card) === -1 &&
              out.indexOf(card) === -1 &&
              !(group && usedGroups.has(group))) {
            out.push(card);
            if (group) {
              usedGroups.add(group);
            }
          }
        }
        return out;
      }

      pickedInd = pickedInd.concat(takeRest(individual - pickedInd.length));
      pickedSh = pickedSh.concat(takeRest(shared - pickedSh.length));
      while (pickedInd.length < individual) {
        pickedInd.push(Object.assign({}, randomChoice(indPool.length ? indPool : pool)));
      }
      while (pickedSh.length < shared) {
        pickedSh.push(Object.assign({}, randomChoice(shPool.length ? shPool : pool)));
      }
      return pickedInd.concat(pickedSh);
    }

    dealCards() {
      var shared = new Set(this.shared);
      var order = [];
      for (var i = 0; i < this.cards.length; i++) {
        if (!shared.has(i)) {
          order.push(i);
        }
      }
      shuffle(order);
      var count = order.length;
      var take;
      if (count >= 4) {
        take = randInt(2, count - 2);
      } else if (count >= 2) {
        take = randInt(1, count - 1);
      } else if (count === 1) {
        take = randInt(0, 1);
      } else {
        take = 0;
      }
      this.zones = {
        left: order.slice(0, take).sort(function (a, b) { return a - b; }),
        right: order.slice(take).sort(function (a, b) { return a - b; })
      };
      this.selected = null;
    }

    newSession(individual, shared) {
      this.roundNo = 0;
      this.sessionId = uuidHex();
      this.money = { left: START_GOLD, right: TOTAL_GOLD - START_GOLD };
      this.splitterId = this.netId;
      this.splitterName = this.myName();
      this.chooserId = null;
      this.chooserName = "";
      this.templateSavedKey = null;
      if (this.templateBlobUrl) {
        URL.revokeObjectURL(this.templateBlobUrl);
        this.templateBlobUrl = null;
      }
      this.templateFileName = "";
      this.btnTemplate.hidden = true;
      this.newDraft(individual, shared);
    }

    askNewDraft() {
      if (this.draftModal.hidden) {
        this.indInput.value = String(this.indTotal);
        this.sharedInput.value = String(this.sharedTotal);
        this.updateDraftTotal();
        this.draftModal.hidden = false;
      }
      this.draftDialog = this.draftModal;
      this.indInput.focus();
      this.indInput.select();
    }

    updateDraftTotal() {
      function valueOf(input) {
        var value = parseInt(input.value, 10);
        return Number.isFinite(value) ? value : 0;
      }
      var total = Math.max(0, valueOf(this.indInput)) +
        Math.max(0, valueOf(this.sharedInput));
      this.draftTotalEl.textContent = "Всего карт: " + total;
    }

    createDraftFromDialog() {
      var individual = parseInt(this.indInput.value, 10);
      var shared = parseInt(this.sharedInput.value, 10);
      if (!Number.isFinite(individual)) {
        individual = 0;
      }
      if (!Number.isFinite(shared)) {
        shared = 0;
      }
      individual = clamp(individual, 0, MAX_INDIVIDUAL);
      shared = clamp(shared, 0, MAX_SHARED);
      this.closeDraftDialog();
      this.newSession(individual, shared);
    }

    closeDraftDialog() {
      this.draftModal.hidden = true;
      this.draftDialog = null;
    }

    confirmSplit() {
      if (this.phase !== "splitting" || !this.isSplitter()) {
        return;
      }
      this.selected = null;
      this.castleSelected = null;
      this.phase = "choosing";
      if (this.chooserName && this.chooserId !== this.netId) {
        this.log("Раскладка готова. Сторону выбирает " +
          this.roleName("chooser") + ".");
      } else if (this.netReady()) {
        this.log("Раскладка готова. Ждём выбор оппонента.");
      } else {
        this.log("Раскладка готова. Выберите сторону.");
      }
      this.refresh();
    }

    pickSide(side) {
      if (!this.canChoose()) {
        return;
      }
      this.resolvePick(side);
    }

    resolvePick(side) {
      if (!this.canChoose() || (side !== "left" && side !== "right")) {
        return;
      }
      var other = side === "left" ? "right" : "left";
      var chosenCards = this.zones[side].slice();
      var restCards = this.zones[other].slice();

      this.picked = side;
      this.phase = "result";

      var color = COLOR_WORD[this.setups[side].color] || "зона";
      if (!this.chooserId) {
        this.log("Выбрана " + color + " зона: " + this.setupText(side) + ".");
        this.log("Обе зоны достаются вам.");
      } else {
        var chooser = this.chooserId === this.netId ? "Вы" : this.roleName("chooser");
        var splitter = this.splitterId === this.netId ? "Вы" : this.roleName("splitter");
        var colorAcc = COLOR_ACC[this.setups[side].color] || "выбранную";
        this.log(chooser + " " + (chooser === "Вы" ? "выбираете" : "выбирает") +
          " " + colorAcc + " зону: " + this.setupText(side) + ".");
        this.log(chooser + " " + (chooser === "Вы" ? "получаете" : "получает") +
          ": " + this.describe(chosenCards) + ".");
        this.log(splitter + " " + (splitter === "Вы" ? "получаете" : "получает") +
          ": " + this.describe(restCards) + ".");
        this.log("Сетап: " + splitter + " — " + this.setupText(other) + "; " +
          chooser + " — " + this.setupText(side) + ".");
      }
      this.announceResult(side);
      this.saveDraftTemplate(true);
      this.refresh();
    }

    // --- ПАНЕЛИ И ТЕКСТЫ ---

    updateInfo() {
      var text;
      if (this.phase === "idle") {
        text = "НЕТ\nРАСКЛАДА";
      } else if (this.phase === "splitting") {
        text = this.isSplitter()
          ? "РАСКЛАДКА\nЗОН"
          : "ЖДЁМ\n" + this.roleName("splitter");
      } else if (this.phase === "choosing") {
        text = this.canChoose()
          ? "ВАШ\nВЫБОР"
          : "ВЫБИРАЕТ\n" + this.roleName("chooser");
      } else {
        text = "ДРАФТ " + this.roundNo + "\nГОТОВ";
      }
      this.infoEl.textContent = text;
    }

    updateControls() {
      var humanSplit = this.phase === "splitting" && this.isSplitter();
      this.btnDone.disabled = !humanSplit;
      this.btnNew.disabled = false;
      for (var side of ["left", "right"]) {
        var panel = this.goldPanels[side];
        panel.input.disabled = !humanSplit;
        panel.panel.style.setProperty(
          "--side-color", COLOR_FILL[this.setups[side].color] || "#8a5a1f"
        );
      }
      this.syncNetWidgets();
    }

    syncNetWidgets() {
      var online = this.net !== null;
      var chatReady = !!(online && this.netConnected);
      this.nameInput.disabled = online;
      this.roomInput.disabled = online;
      this.chatInput.disabled = !chatReady;
      this.btnSend.disabled = !chatReady;
      this.btnCoin.disabled = !chatReady;
      this.btnConnect.textContent = online ? "Отключиться" : "Подключиться";
    }

    refresh() {
      this.redraw();
      this.updateInfo();
      this.updateControls();
      this.publishBoard();
    }

    setupText(side) {
      var setup = this.setups[side];
      return setup.color.toUpperCase() + " · " + setup.castle + " · " +
        fmtGold(setup.money);
    }

    describe(indices) {
      if (!indices.length) {
        return "—";
      }
      var parts = [];
      for (var i = 0; i < indices.length; i++) {
        var name = this.cards[indices[i]].name || "Карта";
        parts.push(name.length <= 28 ? name : name.slice(0, 26) + "…");
      }
      return parts.join("; ");
    }

    cardLabel(index, iconsOnly) {
      var card = this.cards[index];
      var name = String(card.name || "Карта").trim();
      var limit = iconsOnly ? 12 : 40;
      if (name.length > limit) {
        name = name.slice(0, limit - 1) + "…";
      }
      return name;
    }

    cardList(indices, iconsOnly) {
      if (!indices.length) {
        return "—";
      }
      var self = this;
      return indices.map(function (index) {
        return "• " + self.cardLabel(index, iconsOnly);
      }).join("\n");
    }

    playerResultText(zone, indices, iconsOnly) {
      var setup = this.setups[zone];
      var color = (COLOR_WORD[setup.color] || "сторона");
      color = color.charAt(0).toUpperCase() + color.slice(1);
      return color + ", " + setup.castle + ".\n\nКарты:\n" +
        this.cardList(indices, iconsOnly);
    }

    resultMessages(side) {
      var other = side === "left" ? "right" : "left";
      var splitter = this.splitterName || "Игрок";
      var chooser = this.chooserId
        ? (this.chooserName || "Игрок")
        : splitter;
      var entries = [
        [splitter, this.playerResultText(other, this.zones[other])],
        [chooser, this.playerResultText(side, this.zones[side])],
        ["Общие карты", "\n\n" + this.cardList(this.shared)]
      ];
      var tooLong = entries.some(function (entry) {
        return entry[1].length > 500;
      });
      if (tooLong) {
        entries = [
          [splitter, this.playerResultText(other, this.zones[other], true)],
          [chooser, this.playerResultText(side, this.zones[side], true)],
          ["Общие карты", "\n\n" + this.cardList(this.shared, true)]
        ];
      }
      return entries.map(function (entry) {
        return [String(entry[0]).slice(0, 24), String(entry[1]).slice(0, 500)];
      });
    }

    announceResult(side) {
      var messages = this.resultMessages(side);
      for (var i = 0; i < messages.length; i++) {
        this.chatToRoom(messages[i][1], {
          name: messages[i][0],
          style: "result"
        });
      }
    }

    // --- ШАБЛОН .h3t ---

    saveDraftTemplate(auto) {
      var key = this.sessionId + ":" + this.roundNo;
      if (this.templateSavedKey === key) {
        return this.templateFileName || null;
      }
      if (this.phase !== "result" || !this.cards.length) {
        return null;
      }
      try {
        var result = window.TemplateTool.buildTemplate(
          this.cards, this.zones, this.templateText
        );
        this.templateSavedKey = key;
        this.templateFileName = result.filename;
        if (this.templateBlobUrl) {
          URL.revokeObjectURL(this.templateBlobUrl);
        }
        this.templateBlobUrl = URL.createObjectURL(new Blob(
          [result.bytes], { type: "application/octet-stream" }
        ));
        this.btnTemplate.hidden = false;
        this.btnTemplate.textContent = "Скачать шаблон .h3t";
        if (auto) {
          this.downloadTemplate();
        }
        if (result.applied.length) {
          var changes = result.applied.map(function (item) {
            return item.path + (item.target ? " #" + item.target : "");
          }).join("; ");
          this.log("Шаблон сохранён: " + result.filename +
            " (правки: " + changes + ").");
        } else {
          this.log("Шаблон сохранён без правок: " + result.filename + ".");
        }
        return result.filename;
      } catch (err) {
        this.log("Не удалось сохранить шаблон: " +
          (err && err.message ? err.message : String(err)));
        return null;
      }
    }

    downloadTemplate() {
      if (!this.templateBlobUrl) {
        return;
      }
      var link = document.createElement("a");
      link.href = this.templateBlobUrl;
      link.download = this.templateFileName ||
        window.TemplateTool.TEMPLATE_OUTPUT;
      document.body.append(link);
      link.click();
      link.remove();
    }

    // --- КОНСОЛЬ ---

    addConsole(text, className) {
      var line = el("div", "console-line" + (className ? " " + className : ""));
      line.textContent = text;
      this.consoleEl.append(line);
      while (this.consoleEl.children.length > CONSOLE_LIMIT) {
        this.consoleEl.firstElementChild.remove();
      }
      this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
    }

    log(message) {
      this.addConsole("> " + message, "sys");
    }

    chatLine(text, tag) {
      this.addConsole(text, tag || "chat");
    }

    // --- СЕТЬ: MQTT ---

    setNetStatus(text, color) {
      this.netStatusEl.textContent = text;
      this.netStatusEl.style.color = color || "#cdb894";
    }

    toggleConnection() {
      if (this.net === null) {
        this.connectMqtt();
      } else {
        this.disconnectMqtt("Вы вышли из комнаты.");
      }
    }

    connectMqtt() {
      if (typeof window.mqtt === "undefined" || !window.mqtt.connect) {
        this.setNetStatus("нет библиотеки MQTT", "#ff9a8a");
        this.log("Не загружена библиотека MQTT (js/mqtt.min.js).");
        return;
      }
      var name = String(this.nameInput.value || "").trim().slice(0, 24) || "Игрок";
      var room = String(this.roomInput.value || "").trim() || "jebus";
      this.netName = name;
      this.netRoom = roomSlug(room);
      if (this.cards.length) {
        if (this.splitterId === this.netId) {
          this.splitterName = name;
        }
        if (this.chooserId === this.netId) {
          this.chooserName = name;
        }
      }
      this.nameInput.value = name;
      this.roomInput.value = this.netRoom;

      var self = this;
      var client;
      try {
        client = window.mqtt.connect(MQTT_WS_URL, {
          clientId: "jebus-" + this.netId.slice(0, 14),
          clean: true,
          connectTimeout: 15000,
          reconnectPeriod: 3000,
          keepalive: 30
        });
      } catch (err) {
        this.setNetStatus("не удалось подключиться", "#ff9a8a");
        this.log("Ошибка MQTT: " + (err && err.message ? err.message : err));
        return;
      }

      this.net = client;
      this.netConnected = false;
      this.setNetStatus("подключение…", "#e6bf74");
      this.syncNetWidgets();
      this.log("Подключаюсь к комнате.");

      client.on("connect", function () {
        self.onMqttConnect(client);
      });
      client.on("message", function (topic, payload) {
        self.onMqttMessage(payload);
      });
      client.on("close", function () {
        self.onMqttClose(client);
      });
      client.on("offline", function () {
        self.onMqttClose(client);
      });
      client.on("error", function (err) {
        if (client !== self.net) {
          return;
        }
        self.setNetStatus("связь потеряна…", "#ff9a8a");
        if (err && err.message) {
          console.warn("MQTT:", err.message);
        }
      });
    }

    onMqttConnect(client) {
      if (client !== this.net) {
        return;
      }
      this.netConnected = true;
      client.subscribe(this.chatTopic(), { qos: 0 });
      this.setNetStatus("в сети", "#9ee493");
      this.syncNetWidgets();
      this.log("Вы в комнате как " + this.netName + ".");
      this.log("Раскладка синхронизируется автоматически.");
      this.netServed = {};
      this.netSynced = false;
      if (this.phase !== "idle") {
        this.publishBoard(true);
      } else {
        this.sendSyncRequest();
      }
    }

    onMqttClose(client) {
      if (client !== this.net) {
        return;
      }
      this.netConnected = false;
      this.setNetStatus("связь потеряна…", "#ff9a8a");
      this.syncNetWidgets();
    }

    disconnectMqtt(message) {
      var client = this.net;
      this.net = null;
      this.netConnected = false;
      if (client) {
        try {
          client.end(true);
        } catch (err) {
          /* клиент уже остановлен */
        }
      }
      this.netRoom = null;
      this.netServed = {};
      this.setNetStatus("не подключено", "#cdb894");
      this.syncNetWidgets();
      if (message) {
        this.log(message);
      }
    }

    chatTopic() {
      return MQTT_PREFIX + "/" + this.netRoom + "/chat";
    }

    netReady() {
      return !!(this.net !== null && this.netConnected && this.netRoom);
    }

    onMqttMessage(payload) {
      var text;
      try {
        text = new TextDecoder("utf-8").decode(payload);
      } catch (err) {
        return;
      }
      var data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        return;
      }
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return;
      }
      if (data.id === this.netId) {
        return; // своё сообщение уже показано локально
      }
      var kind = data.kind;
      if (kind === "sync") {
        var board = data.board;
        var rev = parseInt(data.rev, 10);
        var origin = String(data.origin || data.id || "");
        if (board && typeof board === "object" && Number.isFinite(rev) && origin) {
          if (this.applyBoard(board, rev, origin) === "stale") {
            this.resendBoard(origin, rev);
          }
        }
        return;
      }
      if (kind === "sync_req") {
        var senderOrigin = String(data.origin || data.id || "");
        if (senderOrigin && senderOrigin !== this.netId &&
            this.phase !== "idle" && this.netReady()) {
          this.sendSync(this.syncPayload());
        }
        return;
      }
      if (kind !== "chat") {
        return;
      }
      var sender = String(data.id || "");
      var name = String(data.name || "???").slice(0, 24);
      var body = String(data.text || "").slice(0, 500);
      var style = String(data.style || "");
      if (body) {
        var tag = style === "result" ? "result" : this.playerChatTag(sender);
        this.chatLine(name + ": " + body, tag);
      }
    }

    playerChatTag(senderId) {
      if (senderId && senderId === this.splitterId) {
        return "chatred";
      }
      if (senderId && senderId === this.chooserId) {
        return "chatblue";
      }
      return senderId === this.netId ? "chatred" : "chatblue";
    }

    chatToRoom(text, options) {
      options = options || {};
      var raw = String(text === undefined || text === null ? "" : text);
      if (!raw.trim()) {
        return false;
      }
      if (options.style === "result") {
        raw = raw.replace(/\s+$/, "") + "\n";
      } else {
        raw = raw.trim();
      }
      var body = raw.slice(0, 500);
      var name = options.name || (this.netReady() ? this.netName : this.myName());

      if (this.netReady()) {
        var payload = {
          v: 1,
          kind: "chat",
          id: this.netId,
          name: name,
          text: body,
          style: options.style || "",
          ts: Math.round(Date.now()) / 1000
        };
        try {
          this.net.publish(this.chatTopic(), JSON.stringify(payload), { qos: 0 });
        } catch (err) {
          this.setNetStatus("не отправлено", "#ff9a8a");
          this.log("Ошибка отправки: " +
            (err && err.message ? err.message : err));
          return false;
        }
      }
      if (options.echo !== false) {
        var tag = options.style === "result"
          ? "result"
          : this.playerChatTag(this.netId);
        this.chatLine(name + ": " + body, tag);
      }
      return true;
    }

    sendChat() {
      var text = String(this.chatInput.value || "").trim();
      if (!text) {
        return;
      }
      if (!this.netReady()) {
        this.setNetStatus("нет соединения", "#ff9a8a");
        return;
      }
      if (this.chatToRoom(text)) {
        this.chatInput.value = "";
      }
    }

    flipCoin() {
      if (!this.netReady()) {
        this.setNetStatus("нет соединения", "#ff9a8a");
        return null;
      }
      var side = randomChoice(["орёл", "решка"]);
      var sent = this.chatToRoom(side, {
        name: this.myName() + " бросил монетку"
      });
      return sent ? side : null;
    }

    // --- СИНХРОНИЗАЦИЯ РАСКЛАДКИ ---

    boardState() {
      var setups = {};
      for (var side of ["left", "right"]) {
        setups[side] = {
          color: this.setups[side].color,
          castle: this.setups[side].castle
        };
      }
      return {
        session: this.sessionId,
        round: this.roundNo,
        phase: this.phase,
        picked: this.picked,
        splitter: this.splitterId || "",
        splitter_name: this.splitterName,
        chooser: this.chooserId || "",
        chooser_name: this.chooserName,
        money: { left: this.money.left, right: this.money.right },
        setups: setups,
        cards: this.cards.map(function (card) {
          return Object.assign({}, card);
        }),
        zones: {
          left: this.zones.left.slice(),
          right: this.zones.right.slice()
        },
        shared: this.shared.slice()
      };
    }

    boardSignature() {
      return stableStringify(this.boardState());
    }

    syncPayload() {
      return {
        v: 1,
        kind: "sync",
        id: this.netId,
        rev: this.boardRev,
        origin: this.boardOrigin,
        board: this.boardState(),
        ts: Math.round(Date.now()) / 1000
      };
    }

    sendSync(payload) {
      if (!this.net) {
        return false;
      }
      try {
        this.net.publish(this.chatTopic(), JSON.stringify(payload), { qos: 1 });
        return true;
      } catch (err) {
        this.log("Не удалось отправить раскладку: " +
          (err && err.message ? err.message : err));
        return false;
      }
    }

    sendSyncRequest() {
      if (!this.netReady()) {
        return false;
      }
      var payload = {
        v: 1,
        kind: "sync_req",
        id: this.netId,
        origin: this.netId,
        ts: Math.round(Date.now()) / 1000
      };
      try {
        this.net.publish(this.chatTopic(), JSON.stringify(payload), { qos: 1 });
        return true;
      } catch (err) {
        this.log("Не удалось запросить раскладку: " +
          (err && err.message ? err.message : err));
        return false;
      }
    }

    publishBoard(force) {
      if (this.applyingSync || !this.netReady()) {
        return false;
      }
      if (this.phase === "idle") {
        return false;
      }
      var signature = this.boardSignature();
      if (!force && signature === this.boardSig) {
        return false;
      }
      this.boardRev += 1;
      this.boardOrigin = this.netId;
      if (!this.sendSync(this.syncPayload())) {
        return false;
      }
      this.boardSig = signature;
      return true;
    }

    resendBoard(origin, rev) {
      if (!this.netReady() || rev <= (this.netServed[origin] === undefined
        ? -1
        : this.netServed[origin])) {
        return false;
      }
      this.netServed[origin] = rev;
      return this.sendSync(this.syncPayload());
    }

    applyBoard(board, rev, origin) {
      if (this.phase !== "idle") {
        var comparison = compareVersion(
          rev, origin, this.boardRev, this.boardOrigin
        );
        if (comparison === 0) {
          return "duplicate";
        }
        if (comparison < 0) {
          return "stale";
        }
      }

      var cards;
      var zones;
      var shared;
      try {
        if (!board || !Array.isArray(board.cards) ||
            !board.zones || typeof board.zones !== "object") {
          return "invalid";
        }
        cards = board.cards.map(function (raw) {
          return normalizeCard(raw);
        });
        zones = {
          left: (board.zones.left || []).map(toInteger),
          right: (board.zones.right || []).map(toInteger)
        };
        shared = (board.shared || []).map(toInteger);
      } catch (err) {
        return "invalid";
      }

      var total = cards.length;
      var sharedN = shared.length;
      var indN = total - sharedN;
      if (!(indN >= 0 && indN <= MAX_INDIVIDUAL &&
            sharedN >= 0 && sharedN <= MAX_SHARED)) {
        return "invalid";
      }
      if (new Set(shared).size !== sharedN) {
        return "invalid";
      }
      if (zones.left.length + zones.right.length !== indN) {
        return "invalid";
      }
      var used = zones.left.concat(zones.right, shared);
      if (used.length !== total) {
        return "invalid";
      }
      var sorted = used.slice().sort(function (a, b) { return a - b; });
      for (var i = 0; i < total; i++) {
        if (sorted[i] !== i) {
          return "invalid";
        }
      }

      var money = board.money && typeof board.money === "object"
        ? board.money : {};
      var leftMoney = parseInt(money.left, 10);
      if (!Number.isFinite(leftMoney)) {
        leftMoney = this.money.left;
      }
      leftMoney = clamp(leftMoney, 0, TOTAL_GOLD);
      var setups = board.setups && typeof board.setups === "object"
        ? board.setups : {};

      var session = String(board.session || "");
      if (session && session !== this.sessionId) {
        this.sessionId = session;
      }

      var splitterId = String(board.splitter || origin);
      var splitterName = String(board.splitter_name || "").slice(0, 24);
      var chooserId = String(board.chooser || "") || null;
      var chooserName = String(board.chooser_name || "").slice(0, 24);
      var claimed = false;

      this.applyingSync = true;
      try {
        this.press = null;
        this.clearGhost();
        this.hideZoom();

        var round = parseInt(board.round, 10);
        if (Number.isFinite(round)) {
          this.roundNo = Math.max(1, round);
        }
        var phase = board.phase;
        if (phase === "splitting" || phase === "choosing" || phase === "result") {
          this.phase = phase;
        }
        this.picked = (board.picked === "left" || board.picked === "right")
          ? board.picked : null;

        this.splitterId = splitterId;
        this.splitterName = splitterName;
        this.chooserId = chooserId;
        this.chooserName = chooserName;
        // Второй игрок сам занимает роль выбирающего, как только получил
        // чужой расклад: так оба знают, чей сейчас ход.
        if ((this.phase === "splitting" || this.phase === "choosing") &&
            this.splitterId !== this.netId && !this.chooserId) {
          this.chooserId = this.netId;
          this.chooserName = this.netName.slice(0, 24);
          claimed = true;
        }

        this.cards = cards;
        this.zones = zones;
        this.shared = shared.slice().sort(function (a, b) { return a - b; });
        this.indTotal = indN;
        this.sharedTotal = sharedN;
        this.selected = null;
        this.castleSelected = null;
        this.money = { left: leftMoney, right: TOTAL_GOLD - leftMoney };

        for (var side of ["left", "right"]) {
          var raw = setups[side];
          var castle = raw && typeof raw === "object" ? raw.castle : null;
          this.setups[side] = {
            // Красная зона всегда слева, синяя справа.
            color: side === "left" ? "Красный" : "Синий",
            castle: String(castle || this.setups[side].castle).slice(0, 64),
            money: this.money[side]
          };
        }
        this.syncMoneyVars();

        this.boardRev = rev;
        this.boardOrigin = origin;
        this.boardSig = this.boardSignature();
      } finally {
        this.applyingSync = false;
      }

      this.refresh();
      if (claimed) {
        this.publishBoard(true);
      }
      if (this.phase === "result" && this.picked) {
        // Партнёр выбирающего тоже сохраняет готовый шаблон у себя.
        this.saveDraftTemplate(false);
      }
      if (!this.netSynced) {
        this.netSynced = true;
        this.log("Раскладка получена из комнаты.");
      }
      return "applied";
    }
  }

  function compareVersion(aRev, aOrigin, bRev, bOrigin) {
    if (aRev !== bRev) {
      return aRev < bRev ? -1 : 1;
    }
    if (aOrigin === bOrigin) {
      return 0;
    }
    return aOrigin < bOrigin ? -1 : 1;
  }

  // --- ЗАПУСК ---

  async function init() {
    var deckRaw = [];
    var templateText = "";
    try {
      deckRaw = await loadDeckRaw();
    } catch (err) {
      console.error("Не удалось прочитать набор карт:", err);
    }
    try {
      templateText = await loadTemplateText();
    } catch (err) {
      console.error(err);
    }

    var deck = [];
    (deckRaw || []).forEach(function (item) {
      try {
        deck.push(normalizeCard(item));
      } catch (err) {
        console.warn("Пропущена карта:", err, item);
      }
    });
    if (!deck.length) {
      console.error("Набор карт пуст: проверьте js/data.js");
    }

    window.draftApp = new DraftApp(deck, templateText);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
