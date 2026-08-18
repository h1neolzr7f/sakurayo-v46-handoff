(function (global) {
  "use strict";

  var VERSION = "4.6.0";
  var PREVIEW = "预览界面 · 暂不联网";
  var DRAWERS = Object.freeze(["mission", "mail", "notice", "friend", "calendar", "profile"]);
  var CHAR_NAMES = Object.freeze({ sayo: "月城小夜", aya: "神代绥", rion: "黑羽凛音" });
  var rosterFilter = "all";
  var gachaBanner = "moon";
  var shopRail = "boutique";
  var storyPick = 0;
  var storyTouched = false;
  var profileTab = "base";
  var profileId = "sayo";
  var jumpProfile = "";
  var noticePick = "";
  var mailPick = "";

  var DOSSIERS = Object.freeze({
    sayo: Object.freeze({
      en: "SAYO Tsukishiro",
      birth: "7月24日",
      height: "167cm",
      team: "樱夜特助小队",
    }),
    aya: Object.freeze({
      en: "AYA Jindai",
      birth: "11月3日",
      height: "165cm",
      team: "零号企业追缉课",
    }),
    rion: Object.freeze({
      en: "RION Kuroha",
      birth: "2月14日",
      height: "170cm",
      team: "黄泉流道场",
    }),
  });
