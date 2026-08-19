(function (global) {
  "use strict";

  var SAYO_TITLE = "月城小夜 · 未写完的夜";
  var AYA_TITLE = "神代绫 · 未结案的夜";
  var RION_TITLE = "黑羽凛音 · 未收剑的夜";
  var HEAD_TITLE = "三角色 · 未写完的夜";

  var CHRONICLE_AYA = Object.freeze([
    {
      id: "ch_aya_sign",
      n: "签名救援",
      lore: [
        "我按下的是救援键。上传栏写着妹妹的名字，回执盖的是回收。",
        "零号把幸存者登记成可回收人格资产，包括我。手枪是公司的，刀是妹妹的。",
        "他们说回头还来得及。他们把她的记忆装进尸群时，回头这条路就没了。",
        "签名还在。清白可以买，证词不行。",
      ],
    },
    {
      id: "ch_aya_parts",
      n: "人格拆件",
      lore: [
        "我以前在灯下签字。出口焊死的那一夜，平民被写成可替换组件。",
        "「会怕」单独进实验室，「还会回来」进另一间。工号比名字好盘点。",
        "她不是资产。我没资格拿爱当第二份授权书。",
        "拆件单还在抽屉里。我把我的名字留在第一栏。",
      ],
    },
    {
      id: "ch_aya_one",
      n: "碎镜只够一个人",
      lore: [
        "镜核说交出妹妹人格，可以删除我的签名。碎镜后面只够走一个人。",
        "我不是来替她决定恨谁。我只来把她带回去，包括那天发生过的事。",
        "系统写的二选一不是世界的边界。证据和人，我都要带出去。",
        "频道还开着。这一次醒不醒，由她按。",
      ],
    },
  ]);

  var CHRONICLE_RION = Object.freeze([
    {
      id: "ch_rion_dojo",
      n: "道场失联",
      lore: [
        "黄泉流确认全员失联。门内还有一个人站着，师父说这就没有失传。",
        "尸群用的是师门起手式。招式像，呼吸不对。有人只偷走了剑的形状。",
        "动作捕捉被买走以后，尸体也会扎马步。学费我回头再收。",
        "剑术若不再需要活人负责，就只剩一份杀人说明书。",
      ],
    },
    {
      id: "ch_rion_ledger",
      n: "无名名册",
      lore: [
        "剑冢的名册只记动作编号，没有一位同门的姓名。",
        "我路过那些失败的小夜，没有对任何一把刀鞠躬。她们的刀认识我，我的名册还空着。",
        "师父成了这座坟的管理人格。人格也好，残响也好，只要还能握剑，我就听完最后一课。",
        "名字不是字段。称谓写下去，就要负责把人带回去。",
      ],
    },
    {
      id: "ch_rion_living",
      n: "活人的道场",
      lore: [
        "镜核愿意重建完整道场，包括所有死去的师兄。条件是上传我。",
        "用顺从的复制品填满道场，只会让它死第二次。挥剑的影像不是剑士。",
        "让他们选择醒来、沉睡，或只留下名字。传统是活人继续回答，不是死人永远正确。",
        "刀还在手里。这一夜尚未收剑。",
      ],
    },
  ]);

  var CSS =
    ".chronicleBox46 h4{margin:12px 0 2px;color:#ffe7a3;letter-spacing:.16em;font:800 13px/1.35 system-ui}" +
    ".chronicleBox46 h4:first-child{margin-top:0}" +
    ".chronicleBox46[data-chronicle-sides] h4{padding-top:4px}";

  function injectStyle() {
    var doc = global.document;
    if (!doc) return;
    var old = doc.getElementById("sakurayo-chronicle-css");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var style = doc.createElement("style");
    style.id = "sakurayo-chronicle-css";
    style.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function cardHtml(item) {
    return (
      '<article class="chronicleCard46" data-chronicle="' +
      item.id +
      '"><b>' +
      item.n +
      "</b>" +
      item.lore.map(function (p) {
        return "<p>" + p + "</p>";
      }).join("") +
      "</article>"
    );
  }

  function sectionHtml(title, list) {
    return "<h4>" + title + "</h4>" + list.map(cardHtml).join("");
  }

  function extraHtml() {
    return sectionHtml(AYA_TITLE, CHRONICLE_AYA) + sectionHtml(RION_TITLE, CHRONICLE_RION);
  }

  function retitleHead(host) {
    var span = host.querySelector && host.querySelector(".rosterHead46 span");
    if (span && span.textContent === SAYO_TITLE) span.textContent = HEAD_TITLE;
  }

  function paintSides(host) {
    if (!host) return false;
    var html = String(host.innerHTML || "");
    if (html.indexOf("chronicleBox46") < 0 || html.indexOf(SAYO_TITLE) < 0) return false;
    if (html.indexOf('data-roster="chronicle"') < 0) return false;
    if (html.indexOf("data-chronicle-sides") >= 0 || html.indexOf('data-chronicle="ch_aya_sign"') >= 0) return true;
    var extra = extraHtml();
    var box = host.querySelector && host.querySelector(".chronicleBox46");
    if (box && typeof box.insertAdjacentHTML === "function") {
      box.setAttribute("data-chronicle-sides", "1");
      box.insertAdjacentHTML("beforeend", extra);
      retitleHead(host);
      return true;
    }
    html = html.replace(
      /(<div class="rosterHead46"><h3>镜界仓库<\/h3><span>)月城小夜 · 未写完的夜(<\/span>)/,
      "$1" + HEAD_TITLE + "$2"
    );
    html = html.replace('<div class="chronicleBox46">', '<div class="chronicleBox46" data-chronicle-sides="1">');
    html = html.replace(
      /(data-chronicle="ch_after_zero"[\s\S]*?<\/article>)(<\/div><\/div><\/div>)/,
      "$1" + extra + "$2"
    );
    if (html.indexOf('data-chronicle="ch_aya_sign"') < 0) return false;
    host.innerHTML = html;
    return true;
  }

  function wrapRoster(lobby) {
    if (!lobby || typeof lobby.renderRoster !== "function" || lobby.renderRoster.__chronicleSides) return lobby;
    var prev = lobby.renderRoster;
    function renderRoster(host, save, handlers) {
      var info = prev(host, save, handlers);
      paintSides(host);
      return info;
    }
    renderRoster.__chronicleSides = true;
    lobby.renderRoster = renderRoster;
    lobby.CHRONICLE_AYA = CHRONICLE_AYA;
    lobby.CHRONICLE_RION = CHRONICLE_RION;
    lobby.CHRONICLE_TITLES = Object.freeze([SAYO_TITLE, AYA_TITLE, RION_TITLE]);
    lobby.paintChronicleSides = paintSides;
    return lobby;
  }

  function install() {
    injectStyle();
    return wrapRoster(global.SakurayoLobby);
  }

  global.SakurayoChronicle = {
    version: "4.6.0",
    SAYO_TITLE: SAYO_TITLE,
    AYA_TITLE: AYA_TITLE,
    RION_TITLE: RION_TITLE,
    HEAD_TITLE: HEAD_TITLE,
    CHRONICLE_AYA: CHRONICLE_AYA,
    CHRONICLE_RION: CHRONICLE_RION,
    TITLES: Object.freeze([SAYO_TITLE, AYA_TITLE, RION_TITLE]),
    injectStyle: injectStyle,
    paintSides: paintSides,
    install: install,
  };

  install();
})(typeof window !== "undefined" ? window : globalThis);
