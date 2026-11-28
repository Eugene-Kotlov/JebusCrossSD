/* Разбор, правка и сборка шаблона .h3t: TSV в кодировке windows-1251.
 * Первые три строки — заголовки секций, подсекций и полей.
 * Правка карты: {mode, path, value, target, find, occurrence}, где path —
 * «Секция\\Поле». occurrence выбирает повторяющийся столбец (с 1).
 * target: "$zone" — зона игрока, "$opposite_zone" — зона соперника,
 * "$zone_connection" — коннектор «1-{зона игрока}»,
 * "$opposite_zone_connection" — коннектор «1-{зона соперника}».
 * Если у replace задан find, из ячейки вырезается этот фрагмент и вместо него
 * подставляется value; без find ячейка заменяется целиком.
 */
(function (global) {
  "use strict";

  var TEMPLATE_OUTPUT = "Jebus Cross SD.h3t";
  var APPEND = "append";
  var REPLACE = "replace";
  var TEMPLATE_MODES = [APPEND, REPLACE];
  var TEMPLATE_PATH_SEP = "\\";
  var SELF_ZONE = "$zone";
  var OPP_ZONE = "$opposite_zone";
  var SELF_ZONE_CONNECTION = "$zone_connection";
  var OPP_ZONE_CONNECTION = "$opposite_zone_connection";
  var ZONE_TEMPLATE_IDS = { left: "2", right: "3" };

  // КОДИРОВКА windows-1251
  var cp1251Decoder = null;
  var cp1251Reverse = null;

  function getDecoder() {
    if (!cp1251Decoder) {
      cp1251Decoder = new TextDecoder("windows-1251");
    }
    return cp1251Decoder;
  }

  function decodeCp1251(bytes) {
    return getDecoder().decode(bytes);
  }

  function getReverseTable() {
    if (cp1251Reverse) {
      return cp1251Reverse;
    }
    cp1251Reverse = new Map();
    var decoder = getDecoder();
    for (var byte = 0x80; byte <= 0xff; byte++) {
      var char = decoder.decode(new Uint8Array([byte]));
      if (char && char !== "\ufffd") {
        cp1251Reverse.set(char, byte);
      }
    }
    return cp1251Reverse;
  }

  function encodeCp1251(text) {
    var reverse = getReverseTable();
    var out = [];
    for (var char of String(text)) {
      var code = char.codePointAt(0);
      if (code < 0x80) {
        out.push(code);
        continue;
      }
      var byte = reverse.get(char);
      out.push(byte === undefined ? 0x3f : byte);
    }
    return Uint8Array.from(out);
  }

  function base64ToBytes(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // ПУТИ И НОРМАЛИЗАЦИЯ
  function templatePath(section, subsection, field) {
    return [section, subsection, field]
      .map(function (part) {
        return String(part === undefined || part === null ? "" : part).trim();
      })
      .filter(Boolean)
      .join(TEMPLATE_PATH_SEP);
  }

  function splitTemplatePath(path) {
    var parts = String(path === undefined || path === null ? "" : path)
      .split(TEMPLATE_PATH_SEP)
      .map(function (part) { return part.trim(); })
      .filter(Boolean);
    if (parts.length < 2) {
      throw new Error(
        "Путь к ячейке шаблона должен быть вида «Секция\\Поле»: " + path
      );
    }
    return [parts[0], parts.slice(1, -1).join(TEMPLATE_PATH_SEP), parts[parts.length - 1]];
  }

  function normalizeTemplate(raw) {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      raw = [raw];
    }
    if (!Array.isArray(raw)) {
      return [];
    }
    var out = [];
    raw.forEach(function (item) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }
      var mode = String(item.mode || "").trim().toLowerCase();
      var path = String(item.path || "").trim();
      if (!path) {
        path = templatePath(item.section, item.subsection, item.field);
      }
      var parts;
      try {
        parts = splitTemplatePath(path);
      } catch (err) {
        return;
      }
      var section = parts[0];
      var subsection = parts[1];
      var field = parts[2];
      if (TEMPLATE_MODES.indexOf(mode) === -1 || !section || !field) {
        return;
      }
      var occurrence = parseInt(item.occurrence, 10);
      if (!Number.isFinite(occurrence) || occurrence < 1) {
        occurrence = 1;
      }
      out.push({
        mode: mode,
        path: templatePath(section, subsection, field).slice(0, 160),
        value: String(item.value === undefined || item.value === null ? "" : item.value),
        find: String(item.find === undefined || item.find === null ? "" : item.find),
        occurrence: occurrence,
        target: String(item.target || "").trim().slice(0, 40)
      });
    });
    return out;
  }

  // ЧТЕНИЕ И ЗАПИСЬ ТАБЛИЦЫ
  function splitTsvLine(line) {
    var out = [];
    var current = "";
    var quoted = false;
    for (var i = 0; i < line.length; i++) {
      var char = line[i];
      if (quoted) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            quoted = false;
          }
        } else {
          current += char;
        }
      } else if (char === '"' && current === "") {
        quoted = true;
      } else if (char === "\t") {
        out.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    out.push(current);
    return out;
  }

  function escapeField(value) {
    var text = String(value);
    if (/[\t"\r\n]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function parseH3t(text) {
    var source = String(text || "").replace(/^\ufeff/, "");
    var rawRows = source.split(/\r\n|\n|\r/);
    while (rawRows.length && rawRows[rawRows.length - 1] === "") {
      rawRows.pop();
    }
    var rows = rawRows.map(splitTsvLine);
    if (rows.length < 4) {
      throw new Error("шаблон пуст или повреждён");
    }
    var width = 0;
    rows.forEach(function (row) { width = Math.max(width, row.length); });
    rows.forEach(function (row) {
      while (row.length < width) {
        row.push("");
      }
    });
    return rows;
  }

  function serializeH3t(rows) {
    return rows
      .map(function (row) { return row.map(escapeField).join("\t"); })
      .join("\r\n") + "\r\n";
  }

  function h3tColumns(rows) {
    var sectionRow = rows[0];
    var subsectionRow = rows[1];
    var fieldRow = rows[2];
    var columns = [];
    var section = "";
    var subsection = "";
    for (var c = 0; c < fieldRow.length; c++) {
      if (String(sectionRow[c] || "").trim()) {
        section = String(sectionRow[c]).trim();
        subsection = "";
      }
      if (String(subsectionRow[c] || "").trim()) {
        subsection = String(subsectionRow[c]).trim();
      }
      columns.push({
        index: c,
        section: section,
        subsection: subsection,
        field: String(fieldRow[c] || "").trim()
      });
    }
    return columns;
  }

  function h3tCell(rows, section, subsection, field, target, occurrence) {
    var columns = h3tColumns(rows);
    var matches = [];
    for (var i = 0; i < columns.length; i++) {
      var col = columns[i];
      if (
        col.section.toLowerCase() === String(section).toLowerCase() &&
        col.field.toLowerCase() === String(field).toLowerCase() &&
        (!subsection || col.subsection.toLowerCase() === String(subsection).toLowerCase())
      ) {
        matches.push(col.index);
      }
    }
    if (!matches.length) {
      throw new Error(
        "Столбец " + section + " -> " + subsection + " -> " + field + " не найден"
      );
    }
    var nth = parseInt(occurrence, 10);
    if (!Number.isFinite(nth) || nth < 1) {
      nth = 1;
    }
    if (nth > matches.length) {
      throw new Error(
        "Столбец " + section + " -> " + subsection + " -> " + field +
        " встречается " + matches.length + " раз(а), запрошено вхождение " + nth
      );
    }
    var colIdx = matches[nth - 1];

    var rowIdx = null;
    var low = String(section).toLowerCase();
    if (low === "pack" || low === "map") {
      rowIdx = 3;
    } else if (low === "zone") {
      var idCol = null;
      columns.forEach(function (col) {
        if (col.section === "Zone" && col.field === "Id") {
          idCol = col.index;
        }
      });
      if (idCol !== null) {
        for (var r = 3; r < rows.length; r++) {
          if (String(rows[r][idCol] || "").trim() === String(target)) {
            rowIdx = r;
            break;
          }
        }
      }
    } else if (low === "connections") {
      var z1Col = null;
      var z2Col = null;
      columns.forEach(function (col) {
        if (col.section === "Connections" && col.field === "Zone 1") {
          z1Col = col.index;
        }
        if (col.section === "Connections" && col.field === "Zone 2") {
          z2Col = col.index;
        }
      });
      if (z1Col !== null && z2Col !== null) {
        var pair = String(target).split("-").map(function (part) {
          return part.trim();
        });
        var z1Target = pair[0];
        var z2Target = pair.length > 1 ? pair[1] : "";
        for (var r2 = 3; r2 < rows.length; r2++) {
          var left = String(rows[r2][z1Col] || "").trim();
          var right = String(rows[r2][z2Col] || "").trim();
          if (
            (left === z1Target && right === z2Target) ||
            (left === z2Target && right === z1Target)
          ) {
            rowIdx = r2;
            break;
          }
        }
      }
    }

    if (rowIdx === null) {
      throw new Error("Запись '" + target + "' не найдена в секции '" + section + "'");
    }
    return [rowIdx, colIdx];
  }

  function readH3tRecord(rows, section, subsection, field, target, occurrence) {
    var cell = h3tCell(rows, section, subsection, field, target, occurrence);
    return rows[cell[0]][cell[1]];
  }

  function changeRecord(rows, section, subsection, field, newValue, target, occurrence) {
    var cell = h3tCell(rows, section, subsection, field, target, occurrence);
    var oldValue = rows[cell[0]][cell[1]];
    rows[cell[0]][cell[1]] = String(newValue);
    return oldValue;
  }

  function applyTemplateInstructions(rows, instructions) {
    var applied = [];
    instructions.forEach(function (instr) {
      var mode = String(instr.mode || "");
      if (TEMPLATE_MODES.indexOf(mode) === -1) {
        throw new Error("Неизвестная правка шаблона: " + mode);
      }
      var parts = splitTemplatePath(instr.path);
      var section = parts[0];
      var subsection = parts[1];
      var field = parts[2];
      var target = String(instr.target || "") || null;
      var value = String(instr.value === undefined || instr.value === null ? "" : instr.value);
      var find = String(instr.find === undefined || instr.find === null ? "" : instr.find);
      var occurrence = parseInt(instr.occurrence, 10);
      if (!Number.isFinite(occurrence) || occurrence < 1) {
        occurrence = 1;
      }
      var oldValue;
      var found = null;
      if (mode === APPEND) {
        var oldText = readH3tRecord(rows, section, subsection, field, target, occurrence);
        if (String(oldText).trim()) {
          value = (String(oldText).trim() + " " + value.trim()).trim();
        }
        oldValue = changeRecord(rows, section, subsection, field, value, target, occurrence);
      } else if (find) {
        oldValue = readH3tRecord(rows, section, subsection, field, target, occurrence);
        found = String(oldValue).indexOf(find) !== -1;
        if (found) {
          value = String(oldValue).split(find).join(value);
          changeRecord(rows, section, subsection, field, value, target, occurrence);
        } else {
          value = oldValue;
        }
      } else {
        oldValue = changeRecord(rows, section, subsection, field, value, target, occurrence);
      }
      var item = {
        path: templatePath(section, subsection, field),
        target: target,
        old: oldValue,
        new: value
      };
      if (occurrence > 1) {
        item.occurrence = occurrence;
      }
      if (found !== null) {
        item.find = find;
        item.found = found;
      }
      applied.push(item);
    });
    return applied;
  }

  // СБОРКА НОВОГО ШАБЛОНА
  function templateStamp(date) {
    var when = date || new Date();
    function pad2(value) {
      return String(value).padStart(2, "0");
    }
    return (
      "Jebus Cross " +
      pad2(when.getDate()) + "." + pad2(when.getMonth() + 1) + "." +
      when.getFullYear() + " " +
      pad2(when.getHours()) + ":" + pad2(when.getMinutes()) + ":" +
      pad2(when.getSeconds())
    );
  }

  function cardZoneIds(cards, zones) {
    var result = new Map();
    if (!zones) {
      return result;
    }
    Object.keys(zones).forEach(function (side) {
      var zoneId = ZONE_TEMPLATE_IDS[String(side)];
      if (!zoneId) {
        return;
      }
      zones[side].forEach(function (idx) {
        var number = Number(idx);
        if (!Number.isFinite(number)) {
          return;
        }
        if (number >= 0 && number < cards.length) {
          result.set(number, zoneId);
        }
      });
    });
    return result;
  }

  function buildTemplate(cards, zones, sourceText) {
    var rows = parseH3t(sourceText);
    var zoneIds = cardZoneIds(cards, zones);
    var instructions = [];
    var zoneTargets = [SELF_ZONE, OPP_ZONE, SELF_ZONE_CONNECTION, OPP_ZONE_CONNECTION];

    function resolveZoneTarget(target, zoneId) {
      if (target === SELF_ZONE) {
        return zoneId;
      }
      if (target === OPP_ZONE) {
        return String(5 - parseInt(zoneId, 10));
      }
      // Коннектор с центральной зоной 1: «1-2» для левой, «1-3» для правой.
      if (target === SELF_ZONE_CONNECTION) {
        return "1-" + zoneId;
      }
      return "1-" + String(5 - parseInt(zoneId, 10));
    }

    cards.forEach(function (card, idx) {
      var ownZone = zoneIds.get(idx);
      normalizeTemplate(card.template).forEach(function (raw) {
        var instr = Object.assign({}, raw);
        if (zoneTargets.indexOf(instr.target) !== -1) {
          if (!ownZone) {
            return;
          }
          instr.target = resolveZoneTarget(instr.target, ownZone);
        }
        instructions.push(instr);
      });
    });
    var applied = applyTemplateInstructions(rows, instructions);
    changeRecord(rows, "Pack", "Options", "Name", templateStamp());
    changeRecord(rows, "Pack", "Options", "Description", "");
    var text = serializeH3t(rows);
    return {
      text: text,
      bytes: encodeCp1251(text),
      applied: applied,
      filename: TEMPLATE_OUTPUT
    };
  }

  global.TemplateTool = {
    TEMPLATE_OUTPUT: TEMPLATE_OUTPUT,
    APPEND: APPEND,
    REPLACE: REPLACE,
    SELF_ZONE: SELF_ZONE,
    OPP_ZONE: OPP_ZONE,
    SELF_ZONE_CONNECTION: SELF_ZONE_CONNECTION,
    OPP_ZONE_CONNECTION: OPP_ZONE_CONNECTION,
    templatePath: templatePath,
    splitTemplatePath: splitTemplatePath,
    normalizeTemplate: normalizeTemplate,
    parseH3t: parseH3t,
    serializeH3t: serializeH3t,
    h3tColumns: h3tColumns,
    h3tCell: h3tCell,
    readH3tRecord: readH3tRecord,
    changeRecord: changeRecord,
    applyTemplateInstructions: applyTemplateInstructions,
    templateStamp: templateStamp,
    cardZoneIds: cardZoneIds,
    buildTemplate: buildTemplate,
    decodeCp1251: decodeCp1251,
    encodeCp1251: encodeCp1251,
    base64ToBytes: base64ToBytes
  };
})(window);
