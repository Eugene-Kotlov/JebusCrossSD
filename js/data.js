window.CARD_DECK_RAW = [
  {
    "mutex_group": 1,
    "name": "Без пушек и подушек",
    "image": "card_00001.jpg",
    "type": "shared",
    "short": "Запрещены герои со стартовыми боевыми машинами.",
    "long": "Запрещены герои со стартовыми боевыми машинами (баллистой, палаткой первой помощи или пушкой).",
    "template": [
      {
        "mode": "append",
        "path": "Pack\\Options\\Heroes",
        "value": "-6 -8 -27 -36 -54 -81 -97 -118 -123 -157 -177 -183 -186 -210",
        "target": ""
      }
    ]
  },
  {
    "mutex_group": 2,
    "name": "Рейд по деревням",
    "image": "card_00002.jpg",
    "type": "individual",
    "short": "В этой зоне 4 деревни того же типа, что и стартовый замок. Ящики Пандоры на войско и внешние жилища отсутствуют.",
    "long": "В этой зоне 4 деревни того же типа, что и стартовый замок. Ящики Пандоры на войско и внешние жилища отсутствуют.",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Neutral towns\\Minimum towns",
        "value": "4",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Neutral towns\\Towns are of same type",
        "value": "x",
        "target": "$zone"
      },
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "-17 n -20 n -6 0 0 n",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 3,
    "name": "Копание в грязи",
    "image": "card_00003.jpg",
    "type": "individual",
    "short": "Устанавливает в этой зоне тип земли - Грязь. Обелиск встречается только здесь (ровно 1 на карту).",
    "long": "Устанавливает в этой зоне тип земли - Грязь. Обелиск встречается только здесь (ровно 1 на карту).",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Terrain\\Match to town",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Terrain\\Dirt",
        "value": "x",
        "target": "$zone"
      },
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "-57 0",
        "target": "$opposite_zone"
      },
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "-57 0",
        "target": "4"
      },
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "-57 0",
        "target": "5"
      }
    ]
  },
  {
    "mutex_group": 4,
    "name": "Одна Конса",
    "image": "card_00kg1.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 1 Консерваторию Грифонов.",
    "long": "Закрепляет в зоне ровно 1 Консерваторию Грифонов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 2 d 99999 d 1 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 4,
    "name": "Две Консы",
    "image": "card_00kg2.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 2 Консерватории Грифонов.",
    "long": "Закрепляет в зоне ровно 2 Консерватории Грифонов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 2 d 99999 d 2 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 4,
    "name": "Три Консы",
    "image": "card_00kg3.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 3 Консерватории Грифонов.",
    "long": "Закрепляет в зоне ровно 3 Консерватории Грифонов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 2 d 99999 d 3 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 4,
    "name": "Четыре Консы",
    "image": "card_00kg4.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 4 Консерватории Грифонов.",
    "long": "Закрепляет в зоне ровно 4 Консерватории Грифонов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 2 d 99999 d 4 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 4,
    "name": "Пять Конс",
    "image": "card_00kg5.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 5 Консерваторий Грифонов.",
    "long": "Закрепляет в зоне ровно 5 Консерваторий Грифонов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 2 d 99999 d 5 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 4,
    "name": "Шесть Конс",
    "image": "card_00kg6.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 6 Консерваторий Грифонов.",
    "long": "Закрепляет в зоне ровно 6 Консерваторий Грифонов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 2 d 99999 d 6 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 5,
    "name": "Одна Зефа",
    "image": "card_00zn1.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 1 Заставу Налетчиков.",
    "long": "Закрепляет в зоне ровно 1 Заставу Налетчиков.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 31 d 99999 d 1 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 5,
    "name": "Две Зефы",
    "image": "card_00zn2.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 2 Заставы Налетчиков.",
    "long": "Закрепляет в зоне ровно 2 Заставы Налетчиков.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 31 d 99999 d 2 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 5,
    "name": "Три Зефы",
    "image": "card_00zn3.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 3 Заставы Налетчиков.",
    "long": "Закрепляет в зоне ровно 3 Заставы Налетчиков.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 31 d 99999 d 3 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 5,
    "name": "Четыре Зефы",
    "image": "card_00zn4.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 4 Заставы Налетчиков.",
    "long": "Закрепляет в зоне ровно 4 Заставы Налетчиков.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 31 d 99999 d 4 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 5,
    "name": "Пять Зеф",
    "image": "card_00zn5.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 5 Застав Налетчиков.",
    "long": "Закрепляет в зоне ровно 5 Застав Налетчиков.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 31 d 99999 d 5 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 5,
    "name": "Шесть Зеф",
    "image": "card_00zn6.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 6 Застав Налетчиков.",
    "long": "Закрепляет в зоне ровно 6 Застав Налетчиков.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 31 d 99999 d 6 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 6,
    "name": "Один Улик",
    "image": "card_00uz1.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 1 Улей Ядовитых Змей.",
    "long": "Закрепляет в зоне ровно 1 Улей Ядовитых Змей.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 6 d 99999 d 1 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 6,
    "name": "Два Улика",
    "image": "card_00uz2.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 2 Улья Ядовитых Змей.",
    "long": "Закрепляет в зоне ровно 2 Улья Ядовитых Змей.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 6 d 99999 d 2 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 6,
    "name": "Три Улика",
    "image": "card_00uz3.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 3 Улья Ядовитых Змей.",
    "long": "Закрепляет в зоне ровно 3 Улья Ядовитых Змей.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 6 d 99999 d 3 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 6,
    "name": "Четыре Улика",
    "image": "card_00uz4.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 4 Улья Ядовитых Змей.",
    "long": "Закрепляет в зоне ровно 4 Улья Ядовитых Змей.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 6 d 99999 d 4 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 6,
    "name": "Пять Уликов",
    "image": "card_00uz5.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 5 Ульев Ядовитых Змей.",
    "long": "Закрепляет в зоне ровно 5 Ульев Ядовитых Змей.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 6 d 99999 d 5 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 6,
    "name": "Шесть Уликов",
    "image": "card_00uz6.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 6 Ульев Ядовитых Змей.",
    "long": "Закрепляет в зоне ровно 6 Ульев Ядовитых Змей.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+16 6 d 99999 d 6 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 7,
    "name": "Кровожадные",
    "image": "card_00007.jpg",
    "type": "individual",
    "short": "В этой зоне все охраны кровожадные.",
    "long": "В этой зоне все охраны кровожадные. Никогда не присоединяются.",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Options\\Monsters disposition (standard)",
        "value": "4",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 8,
    "name": "Мальчикам вход воспрещён *",
    "image": "card_00008.jpg",
    "type": "individual",
    "short": "Нападать на ГО или АО этой зоны могут только герои-женщины.",
    "long": "Нападать на ГО или АО этой зоны могут только герои-женщины.\n(* Договорённость, не изменение шаблона).",
    "template": []
  },
  {
    "mutex_group": 8,
    "name": "Девочкам вход воспрещён *",
    "image": "card_000m8.jpg",
    "type": "individual",
    "short": "Нападать на ГО или АО этой зоны могут только герои-мужчины.",
    "long": "Нападать на ГО или АО этой зоны могут только герои-мужчины.\n(* Договорённость, не изменение шаблона).",
    "template": []
  },
  {
    "mutex_group": 9,
    "name": "Эмоции под запретом",
    "image": "card_00009.jpg",
    "type": "shared",
    "short": "Заклинания «Печаль» и «Радость» запрещены.",
    "long": "Заклинания «Печаль» и «Радость» запрещены.",
    "template": [
      {
        "mode": "append",
        "path": "Map\\Spells",
        "value": "-49 -50",
        "target": ""
      }
    ]
  },
  {
    "mutex_group": 10,
    "name": "Бродяги",
    "image": "card_00011.jpg",
    "type": "individual",
    "short": "В этой зоне тип всех охран - Нейтралы.",
    "long": "В этой зоне тип всех охран - Нейтралы.",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Castle",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Rampart",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Tower",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Inferno",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Necropolis",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Dungeon",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Stronghold",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Fortress",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Conflux",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Cove",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Factory",
        "value": "",
        "target": "$zone"
      },
      {
        "mode": "replace",
        "path": "Zone\\Monsters\\Bulwark",
        "value": "",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 11,
    "name": "Две Башни",
    "image": "card_00010.jpg",
    "type": "shared",
    "short": "На смежных зонах тип главного замка и деревень - «Башня».",
    "long": "На смежных зонах тип главного замка и деревень - «Башня».",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Castle",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Rampart",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Inferno",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Necropolis",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Dungeon",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Stronghold",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Fortress",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Conflux",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Cove",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Factory",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Bulwark",
        "value": "",
        "target": "4"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Castle",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Rampart",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Inferno",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Necropolis",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Dungeon",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Stronghold",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Fortress",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Conflux",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Cove",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Factory",
        "value": "",
        "target": "5"
      },
      {
        "mode": "replace",
        "path": "Zone\\Town types\\Bulwark",
        "value": "",
        "target": "5"
      }
    ]
  },
  {
    "mutex_group": 12,
    "name": "Шесть шагов к унынию",
    "image": "card_00012.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 6 Гробниц Воинов.",
    "long": "Закрепляет в зоне ровно 6 Гробниц Воинов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+108 0 d 99999 d 6 d",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 13,
    "name": "Гордость Фракции",
    "image": "card_000t7.jpg",
    "type": "shared",
    "short": "Атаковать ГО или АО могут только герои, в армии которых есть хотя бы одно улучшенное существо 7-го уровня стартового города охраняемой зоны.",
    "long": "Атаковать ГО или АО могут только герои, в армии которых есть хотя бы одно улучшенное существо 7-го уровня стартового города охраняемой зоны.\n(* Договорённость, не изменение шаблона).",
    "template": []
  },
  {
    "mutex_group": 14,
    "name": "Потеряный Легион",
    "image": "card_000pl.jpg",
    "type": "shared",
    "short": "Убраны все артефакты частей Легиона.",
    "long": "Убраны все артефакты частей Легиона.",
    "template": [
      {
        "mode": "append",
        "path": "Map\\Artifacts",
        "value": "-118 -119 -120 -121 -122",
        "target": ""
      }
    ]
  },
  {
    "mutex_group": 15,
    "name": "Молчание Оракулов",
    "image": "card_000mo.jpg",
    "type": "shared",
    "short": "Убраны все Хижины Провидцев на карте.",
    "long": "Убраны все Хижины Провидцев на карте.",
    "template": [
      {
        "mode": "append",
        "path": "Map\\Objects",
        "value": "-83 n n",
        "target": ""
      }
    ]
  },
  {
    "mutex_group": 16,
    "name": "Одна Утопия Драконов",
    "image": "card_00ud1.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 1 Утопию Драконов.",
    "long": "Закрепляет в зоне ровно 1 Утопию Драконов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+25 0 d 99999 d 1 d",
        "target": "$zone"
      }
    ]
  },  
  {
    "mutex_group": 16,
    "name": "Две Утопии Драконов",
    "image": "card_00ud2.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 2 Утопии Драконов.",
    "long": "Закрепляет в зоне ровно 2 Утопии Драконов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+25 0 d 99999 d 2 d",
        "target": "$zone"
      }
    ]
  },  
  {
    "mutex_group": 16,
    "name": "Три Утопии Драконов",
    "image": "card_00ud3.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 3 Утопии Драконов.",
    "long": "Закрепляет в зоне ровно 3 Утопии Драконов.",
    "template": [
      {
        "mode": "append",
        "path": "Zone\\Options\\Objects",
        "value": "+25 0 d 99999 d 3 d",
        "target": "$zone"
      }
    ]
  },  
  {
    "mutex_group": 17,
    "name": "Одна Лампа",
    "image": "card_00dl1.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 1 Древнюю Лампу.",
    "long": "Закрепляет в зоне ровно 1 Древнюю Лампу.",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Options\\Objects",
	"find": "+145 0 d d d d d",
        "value": "+145 0 d 99999 d 1 8191",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 17,
    "name": "Две Лампы",
    "image": "card_00dl2.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 2 Древние Лампы.",
    "long": "Закрепляет в зоне ровно 2 Древние Лампы.",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Options\\Objects",
	"find": "+145 0 d d d d d",
        "value": "+145 0 d 99999 d 2 8191",
        "target": "$zone"
      }
    ]
  },
  {
    "mutex_group": 17,
    "name": "Три Лампы",
    "image": "card_00dl3.jpg",
    "type": "individual",
    "short": "Закрепляет в зоне ровно 3 Древние Лампы.",
    "long": "Закрепляет в зоне ровно 3 Древние Лампы.",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Options\\Objects",
	"find": "+145 0 d d d d d",
        "value": "+145 0 d 99999 d 3 8191",
        "target": "$zone"
      }
    ]
  },

  {
    "mutex_group": 18,
    "name": "Богатая трежа",
    "image": "card_000t1.jpg",
    "type": "shared",
    "short": "Устанавливает уроверь наполнения сокровищницы на максимум.",
    "long": "Устанавливает уроверь наполнения сокровищницы на максимум.",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Treasure\\Low",
        "occurrence": 1,
	"value": "55000",
        "target": "1"
      },
      {
        "mode": "replace",
        "path": "Zone\\Treasure\\Low",
        "occurrence": 2,
	"value": "35000",
        "target": "1"
      },
      {
        "mode": "replace",
        "path": "Zone\\Treasure\\Low",
        "occurrence": 3,
        "value": "25000",
        "target": "1"
      }
    ]
  },
  {
    "mutex_group": 18,
    "name": "Бедная трежа",
    "image": "card_000t2.jpg",
    "type": "shared",
    "short": "Устанавливает уроверь наполнения сокровищницы на минимум.",
    "long": "Устанавливает уроверь наполнения сокровищницы на минимум.",
    "template": [
      {
        "mode": "replace",
        "path": "Zone\\Treasure\\High",
        "occurrence": 1,
	"value": "35000",
        "target": "1"
      },
      {
        "mode": "replace",
        "path": "Zone\\Treasure\\High",
        "occurrence": 2,
	"value": "25000",
        "target": "1"
      },
      {
        "mode": "replace",
        "path": "Zone\\Treasure\\High",
        "occurrence": 3,
        "value": "10000",
        "target": "1"
      }
    ]
  },
];

window.TEMPLATE_B64 = "UGFjawkJCQkJCQkJCQkJCQkJCU1hcAkJCQkJCQkJCQkJCQlab25lCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJQ29ubmVjdGlvbnMJCQkJCQkJCQkJCQkJDQpGaWVsZCBjb3VudAkJCQkJCQlPcHRpb25zCQkJCQkJCQkJCQkJCQkJCQkJCQkJCVR5cGUJCQkJCVJlc3RyaWN0aW9ucwkJCQlQbGF5ZXIgdG93bnMJCQkJCU5ldXRyYWwgdG93bnMJCQkJCVRvd24gdHlwZXMJCQkJCQkJCQkJCQlNaW5pbXVtIG1pbmVzCQkJCQkJCU1pbmUgRGVuc2l0eQkJCQkJCQlUZXJyYWluCQkJCQkJCQkJCQlNb25zdGVycwkJCQkJCQkJCQkJCQkJCVRyZWFzdXJlCQkJCQkJCQkJT3B0aW9ucwkJCQkJCQkJCQkJCQkJCQkJCVpvbmVzCQlPcHRpb25zCQkJCQkJCVJlc3RyaWN0aW9ucwkJCQ0KVG93bglUZXJyYWluCVpvbmUgdHlwZQlQYWNrIG5ldwlNYXAgbmV3CVpvbmUgbmV3CUNvbm5lY3Rpb24gbmV3CU5hbWUJRGVzY3JpcHRpb24JVG93biBzZWxlY3Rpb24JSGVyb2VzCU1pcnJvcglUYWdzCU1heCBCYXR0bGUgUm91bmRzCUZvcmJpZCBIaXJpbmcgSGVyb2VzCU5hbWUJTWluaW11bSBTaXplCU1heGltdW0gU2l6ZQlBcnRpZmFjdHMJQ29tYm8gQXJ0cwlTcGVsbHMJU2Vjb25kYXJ5IHNraWxscwlPYmplY3RzCVJvY2sgYmxvY2tzCVpvbmUgc3BhcnNlbmVzcwlTcGVjaWFsIHdlZWtzIGRpc2FibGVkCVNwZWxsIFJlc2VhcmNoCUFuYXJjaHkJSWQJaHVtYW4gc3RhcnQJY29tcHV0ZXIgc3RhcnQJVHJlYXN1cmUJSnVuY3Rpb24JQmFzZSBTaXplCU1pbmltdW0gaHVtYW4gcG9zaXRpb25zCU1heGltdW0gaHVtYW4gcG9zaXRpb25zCU1pbmltdW0gdG90YWwgcG9zaXRpb25zCU1heGltdW0gdG90YWwgcG9zaXRpb25zCU93bmVyc2hpcAlNaW5pbXVtIHRvd25zCU1pbmltdW0gY2FzdGxlcwlUb3duIERlbnNpdHkJQ2FzdGxlIERlbnNpdHkJTWluaW11bSB0b3ducwlNaW5pbXVtIGNhc3RsZXMJVG93biBEZW5zaXR5CUNhc3RsZSBEZW5zaXR5CVRvd25zIGFyZSBvZiBzYW1lIHR5cGUJQ2FzdGxlCVJhbXBhcnQJVG93ZXIJSW5mZXJubwlOZWNyb3BvbGlzCUR1bmdlb24JU3Ryb25naG9sZAlGb3J0cmVzcwlDb25mbHV4CUNvdmUJRmFjdG9yeQlCdWx3YXJrCVdvb2QJTWVyY3VyeQlPcmUJU3VsZnVyCUNyeXN0YWwJR2VtcwlHb2xkCVdvb2QJTWVyY3VyeQlPcmUJU3VsZnVyCUNyeXN0YWwJR2VtcwlHb2xkCU1hdGNoIHRvIHRvd24JRGlydAlTYW5kCUdyYXNzCVNub3cJU3dhbXAJUm91Z2gJQ2F2ZQlMYXZhCUhpZ2hsYW5kcwlXYXN0ZWxhbmQJU3RyZW5ndGgJTWF0Y2ggdG8gdG93bglOZXV0cmFsCUNhc3RsZQlSYW1wYXJ0CVRvd2VyCUluZmVybm8JTmVjcm9wb2xpcwlEdW5nZW9uCVN0cm9uZ2hvbGQJRm9ydHJlc3MJQ29uZmx1eAlDb3ZlCUZhY3RvcnkJQnVsd2FyawlMb3cJSGlnaAlEZW5zaXR5CUxvdwlIaWdoCURlbnNpdHkJTG93CUhpZ2gJRGVuc2l0eQlQbGFjZW1lbnQJT2JqZWN0cwlNaW5pbXVtIG9iamVjdHMJSW1hZ2Ugc2V0dGluZ3MJRm9yY2UgbmV1dHJhbCBjcmVhdHVyZXMJQWxsb3cgbm9uLWNvaGVyZW50IHJvYWQJWm9uZSByZXB1bHNpb24JVG93biBIaW50CU1vbnN0ZXJzIGRpc3Bvc2l0aW9uIChzdGFuZGFyZCkJTW9uc3RlcnMgZGlzcG9zaXRpb24gKGN1c3RvbSkJTW9uc3RlcnMgam9pbmluZyBwZXJjZW50YWdlCU1vbnN0ZXJzIGpvaW4gb25seSBmb3IgbW9uZXkJTWluaW11bSBhaXJzaGlwIHNoaXB5YXJkcwlBaXJzaGlwIHNoaXB5YXJkIERlbnNpdHkJVGVycmFpbiBIaW50CUFsbG93ZWQgRmFjdGlvbnMJRmFjdGlvbiBIaW50CU1heCBibG9jayB2YWx1ZQlab25lIDEJWm9uZSAyCVZhbHVlCVdpZGUJQm9yZGVyIEd1YXJkCVJvYWQJVHlwZQlGaWN0aXZlCVBvcnRhbCByZXB1bHNpb24JTWluaW11bSBodW1hbiBwb3NpdGlvbnMJTWF4aW11bSBodW1hbiBwb3NpdGlvbnMJTWluaW11bSB0b3RhbCBwb3NpdGlvbnMJTWF4aW11bSB0b3RhbCBwb3NpdGlvbnMNCjEyCTEwCTQJOAkxMAkxOAk0CUplYnVzIENyb3NzCVhMLVUgdGVtcGxhdGUsIG5vdCBtb3N0LWJhbGFuY2VkLCBidXQgb25lIG9mIHRoZSBtb3N0IHBvcHVsYXIgb3ZlcmFsbCwgZHVlIHRvIGl0cyBzaW1wbGUgbGF5b3V0IGFuZCBmYXN0IHBhY2UuIEV2ZXJ5IHBsYXllciBzdGFydHMgb24gYSBiaWcsIHBvb3JseSBndWFyZGVkIGFuZCByaWNoIHpvbmUuIEZyb20gdGhlIHN0YXJ0aW5nIHpvbmUgdGhleSB0cnkgdG8gZW50ZXIgdGhlIGV4dHJhLXJpY2ggY2VudHJhbCB6b25lIGRlZmVhdGluZyBhIHN0cm9uZyBndWFyZCBhcyBlYXJseSBhcyBwb3NzaWJsZS4JCQkJCTEwMAkJSmVidXMgQ3Jvc3MJOQkxNgkJCQkJKzk1IDAgZCBkIGQgMyBkICsxNDQgNCBkIGQgZCAzIGQgKzE0NCA1IGQgZCBkIDMgZAkJCXgJeAkJMQkJCXgJCTQwCTEJNAkyCTQJCQkJCQkJMgkJCQl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJeAkJCQkJCQk0CQkJCQkJCQkJCXgJCQkJCQkJCQlzdHJvbmcJCXgJeAl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJMzUwMDAJNTUwMDAJMwkyNTAwMAkzNTAwMAkxMAkxMDAwMAkyNTAwMAkxMAkJCQk0MCAxMjAJCQkJCTMJCTEJeAkJCQkJCQkxCTIJNDUwMDAJCQkJCQkJMQk0CTIJNAkNCgkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkyCXgJCQkJMzAJMQk0CTIJNAkxCQkxCQkJMgkJCQkJeAl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJNAkxCTQJMQkxCTEJMgkJCQkJCQkJeAkJCQkJCQkJCQkJd2VhawkJeAl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJeAkxMjAwMAkyMjAwMAkxCTUwMDAJMTYwMDAJNgkzMDAJMzAwMAkxNAkJKzE0NSAwIGQgZCBkIGQgZAkJLTUwIDEyMAkJCXgJCTMJCTEJeAkJCQkJCQkxCTMJNDUwMDAJCQkJCQkJMQk0CTIJNAkNCgkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkzCXgJCQkJMzAJMQk0CTIJNAkyCQkxCQkJMgkJCQkJeAl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJNAkxCTQJMQkxCTEJMgkJCQkJCQkJeAkJCQkJCQkJCQkJd2VhawkJeAl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJeAkxMjAwMAkyMjAwMAkxCTUwMDAJMTYwMDAJNgkzMDAJMzAwMAkxNAkJKzE0NSAwIGQgZCBkIGQgZAkJMTMwIDEyMAkJCXgJCTMJCTEJeAkJCQkJCQkxCTQJNDUwMDAJCQkJCQkJMQk0CTIJNAkNCgkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQk0CXgJCQkJMzAJMQk0CTIJNAkzCQkxCQkJMgkJCQkJeAl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJNAkxCTQJMQkxCTEJMgkJCQkJCQkJeAkJCQkJCQkJCQkJd2VhawkJeAl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJeAkxMjAwMAkyMjAwMAkxCTUwMDAJMTYwMDAJNgkzMDAJMzAwMAkxNAkJKzE0NSAwIGQgZCBkIGQgZAkJNDAgMjEwCQkJeAkJMwkJMQl4CQkJCQkJCTEJNQk0NTAwMAkJCQkJCQkxCTQJMgk0CQ0KCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCTUJeAkJCQkzMAkxCTQJMgk0CTQJCTEJCQkyCQkJCQl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJeAk0CTEJNAkxCTEJMQkyCQkJCQkJCQl4CQkJCQkJCQkJCQl3ZWFrCQl4CXgJeAl4CXgJeAl4CXgJeAl4CXgJeAl4CTEyMDAwCTIyMDAwCTEJNTAwMAkxNjAwMAk2CTMwMAkzMDAwCTE0CQkrMTQ1IDAgZCBkIGQgZCBkCQk0MCAzMAkJCXgJCTMJCTEJeAkJCQkJCQkJCQkJCQkJCQkJCQkJDQo=";
