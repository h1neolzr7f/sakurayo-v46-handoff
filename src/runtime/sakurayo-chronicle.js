(function (global) {
  "use strict";

  var SAYO_TITLE = "月城小夜 · 未写完的夜";
  var AYA_TITLE = "神代绫 · 作废的工号";
  var RION_TITLE = "黑羽凛音 · 未署名的刀";

  var CHRONICLE_AYA = Object.freeze([
    {
      id: "ch_aya_badge",
      n: "工牌还在",
      lore: [
        "我还别着那张工牌。名字被涂掉，编号还在灯下反光。",
        "企业说回头还来得及。他们把妹妹的记忆装进尸群时，回头这条路就没了。",
        "手枪是公司的，刀是妹妹的。工牌夹在领口，像没卸完的权限。",
        "工牌还在。人已经不在花名册上。",
      ],
    },
    {
      id: "ch_aya_void",
      n: "作废回收",
      lore: [
        "我按下的是救援键。上传栏写着妹妹的名字，回执盖的是回收。",
        "券是金的，门是假的。VOID 两个字母比我的工号清楚。",
        "他们把「会怕」单独装箱，「还会回来」标成下一季度的库存。",
        "作废两个字没有退款。签名还在，清白可以买，证词不行。",
      ],
    },
    {
      id: "ch_aya_petal",
      n: "花比刀快",
      lore: [
        "零号拆人格的时候，把「犹豫」单独装进一朵花里。花不是武器，是我没说出口的那句话。",
        "手枪还在呼吸，太刀还在腰上。花瓣先落地，像替我出鞘。",
        "我伸手去够刀柄，只够到一片已经凉的花。",
        "花比刀快。人还站着，指令已经过期。",
      ],
    },
    {
      id: "ch_aya_seam",
      n: "镜缝本体",
      lore: [
        "碎镜后面只够走一个人。镜核说交出妹妹，可以删除我的签名。",
        "我把一只手伸进缝里。缝那边是她的频道，这边是还没结案的工号。",
        "我不是来替她决定恨谁。系统写的二选一不是世界的边界。",
        "镜缝还亮。本体没有从这一侧的名册上走回来。",
      ],
    },
  ]);

  var CHRONICLE_RION = Object.freeze([
    {
      id: "ch_rion_page",
      n: "刀背署名",
      lore: [
        "黑羽家谱把活着的我写在正面，把另一页写在刀背上。",
        "刀光先到，名字后到。折断的不是刃，是那句「我会回来」。",
        "羽织袖口有没写完的名。家纹比心跳清楚。",
        "刀还在响。署名栏是空的。",
      ],
    },
    {
      id: "ch_rion_mound",
      n: "剑冢旁观",
      lore: [
        "我路过那些失败的小夜，没有对任何一把刀鞠躬。她们的刀认识我。",
        "剑冢的名册只记动作编号，没有一位同门的姓名。",
        "师父成了这座坟的管理人格。人格也好，残响也好，只要还能握剑，我就听完最后一课。",
        "我站在旁边。核心还在最里面，我没有替她们走进去。",
      ],
    },
    {
      id: "ch_rion_unsaid",
      n: "没有道号",
      lore: [
        "黄泉流要道号，黑羽家只要活人还站着。两栏我都没填完。",
        "木刀比家谱诚实。我先鞠躬再出招，没有人喊停，也没有人赐名。",
        "仙名可以后补。没有道号的刀，照样要送人回去。",
        "袖里那张纸是空的。刀已经出鞘。",
      ],
    },
    {
      id: "ch_rion_bride",
      n: "无人掀盖",
      lore: [
        "黄泉不收活人的聘礼。红盖头下面还是我。",
        "刀比誓词先落地。嫁妆是一把葬刀。",
        "用顺从的复制品填满道场，只会让它死第二次。",
        "没有人来掀盖头。这一夜我尚未收剑。",
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

  function paintSides(host) {
    if (!host) return false;
    var html = String(host.innerHTML || "");
    if (html.indexOf("chronicleBox46") < 0 || html.indexOf(SAYO_TITLE) < 0) return false;
    if (html.indexOf('data-roster="chronicle"') < 0) return false;
    if (html.indexOf("data-chronicle-sides") >= 0 || html.indexOf('data-chronicle="ch_aya_badge"') >= 0) return true;
    var extra = extraHtml();
    var box = host.querySelector && host.querySelector(".chronicleBox46");
    if (box && typeof box.insertAdjacentHTML === "function") {
      box.setAttribute("data-chronicle-sides", "1");
      box.insertAdjacentHTML("beforeend", extra);
      return true;
    }
    html = html.replace('<div class="chronicleBox46">', '<div class="chronicleBox46" data-chronicle-sides="1">');
    html = html.replace(
      /(data-chronicle="ch_after_zero"[\s\S]*?<\/article>)(<\/div><\/div><\/div>)/,
      "$1" + extra + "$2"
    );
    if (html.indexOf('data-chronicle="ch_aya_badge"') < 0) return false;
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
    version: "4.6.2",
    SAYO_TITLE: SAYO_TITLE,
    AYA_TITLE: AYA_TITLE,
    RION_TITLE: RION_TITLE,
    CHRONICLE_AYA: CHRONICLE_AYA,
    CHRONICLE_RION: CHRONICLE_RION,
    TITLES: Object.freeze([SAYO_TITLE, AYA_TITLE, RION_TITLE]),
    injectStyle: injectStyle,
    paintSides: paintSides,
    install: install,
  };

  install();
})(typeof window !== "undefined" ? window : globalThis);
