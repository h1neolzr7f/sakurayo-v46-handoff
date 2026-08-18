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
