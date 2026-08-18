import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-shell.js"), "utf8");
const sandbox = { window: {}, document: null, Math, Date, Object, Array, Number, String };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const S = sandbox.window.SakurayoShell;

assert.equal(S.version, "4.6.0");
assert.deepEqual([...S.DRAWERS], ["mission", "mail", "notice", "friend", "calendar", "profile"]);
assert.equal(S.PREVIEW, "预览界面 · 暂不联网");

const save = { coins: 777, done: [1, 2], tal: { a: 3, b: 1 }, runs: 4, kills: 90, story: [0], shop40: { ops: { pulls: 1 } } };
S.ensureMeta(save);
const money = S.wallets(save);
assert.equal(money.sakura, 777);
assert.equal(money.prism, 80);
assert.equal(money.shard, 40);
assert.equal(money.ticket, 1);
assert.equal(money.energy, 0);
assert.equal(save.coins, 777);
assert.equal(save.prism, undefined);
assert.equal(S.defenseLevel(save), 1 + 2 + 4);
assert.equal(S.bondOf(save).now <= 1500, true);
assert.equal(S.xpOf(save).now <= S.xpOf(save).max, true);
assert.equal(S.recLevel(1), 1);
assert.equal(S.recLevel(4), 37);

const login = S.claimLogin(save);
assert.equal(login.ok, true);
assert.ok(save.coins > 777);
assert.ok(S.wallets(save).ticket >= 2);
assert.equal(S.claimLogin(save).ok, false);
assert.equal(S.claimMission(save, "clear").ok, true);
assert.equal(S.claimMission(save, "clear").ok, false);
assert.equal(S.claimMission(save, "kill").ok, true);
assert.equal(S.claimMail(save, "welcome").ok, true);
assert.equal(S.claimMail(save, "gacha").ok, true);
assert.equal(S.readNotice(save, "story").ok, true);
assert.equal(S.giftBond(save, "sayo").ok, true);
assert.equal(S.setFriend(save, "aya").friend, "aya");
assert.equal(S.friendOf(save), "aya");
assert.equal(S.isMainCard("sayo_echo"), true);
assert.equal(S.isMainCard("void_ticket"), false);
assert.equal(S.isNewCard(save, "last_witness", 1), true);
assert.equal(S.markSeen(save, "last_witness").ok, true);
assert.equal(S.isNewCard(save, "last_witness", 1), false);
assert.equal(S.archiveStats(save).done, 2);
assert.equal(S.archiveStats(save).tal, 4);
const noticeHost = { innerHTML: "", onclick: null };
S.renderNotice(noticeHost, { save });
assert.match(noticeHost.innerHTML, /shellPane46/);
assert.match(noticeHost.innerHTML, /通关记录沿用现有存档字段/);
const profileHost = { innerHTML: "", onclick: null, querySelector() { return null; } };
S.renderProfile(profileHost, { save, characters: {} });
assert.match(code, /破魔弹芯/);
assert.match(code, /data-roster-filter="main"/);
assert.match(code, /homeSupport46/);
save.shell46.shard = 120;
const swapped = S.exchange(save, "shard-coin");
assert.equal(swapped.ok, true);
assert.equal(save.shell46.shard, 20);
assert.equal(S.dots(save).calendar, false);
const calHost = { innerHTML: "", onclick: null };
const calSave = { coins: 10 };
S.ensureMeta(calSave);
S.renderCalendar(calHost, { save: calSave });
assert.match(calHost.innerHTML, /领取 · 券\+1/);
assert.match(calHost.innerHTML, /🌸 120 · 券\+1/);

const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
assert.match(html, /支援名册/);
assert.doesNotMatch(html, /好友预览/);
assert.match(html, /runtime\/sakurayo-shell\.js/);
assert.match(html, /\["mission",".*railIco46 task.*","任务","TASK"\]/);
assert.match(html, /installShell46/);
assert.match(html, /"shell46"/);
assert.doesNotMatch(html, /save\.prism\s*=/);
assert.doesNotMatch(code, /localStorage\.setItem/);
assert.doesNotMatch(code, /persist\s*\(/);
assert.doesNotMatch(code, /12天22时/);
assert.doesNotMatch(code, /25\/50/);
assert.doesNotMatch(code, /限时概率UP/);
assert.doesNotMatch(html, /限时概率UP/);
assert.match(code, /本期概率提升/);
assert.match(code, /券\+/);
assert.match(code, /SakurayoAndroid/);
assert.match(code, /clone\.className = "shopSkin46"/);
assert.match(code, /#shopFeatured46\{display:none\}/);
assert.match(code, /时装商店/);
assert.match(code, /本期主推/);
assert.match(code, /isBoutique46/);
assert.match(code, /shopPrism46/);
assert.match(code, /data-shop-buy/);
assert.match(code, /不出售永久伤害/);
assert.match(code, /claimLogin/);
assert.match(code, /stampIn46/);
assert.match(code, /shellStamp46/);
assert.match(code, /classList\.contains\("on"\)/);
assert.match(code, /clearFloats/);
assert.equal(typeof S.clearFloats, "function");
assert.match(S.greetLine(save), /月城小夜|神代绫|黑羽凛音/);
assert.match(S.eventLeft(), /\d+天\d+时/);
assert.equal(S.currentBanner(), "moon");
assert.equal(typeof S.speakLine, "function");
assert.equal(S.speakLine("先领补给，再谈出击。").spoken, false);
const androidBox = {
  window: {},
  document: null,
  Math,
  Date,
  Object,
  Array,
  Number,
  String,
  navigator: { userAgent: "Mozilla/5.0 Linux; Android 15; wv) SakurayoAndroid" },
  speechSynthesis: {
    spoke: false,
    getVoices() {
      return [{ lang: "zh-CN" }];
    },
    cancel() {},
    speak() {
      this.spoke = true;
    },
  },
  SpeechSynthesisUtterance: function (text) {
    this.text = text;
  },
};
androidBox.globalThis = androidBox;
vm.runInNewContext(code, androidBox);
assert.equal(androidBox.window.SakurayoShell.speakLine("先活过这二十秒。").spoken, false);
assert.equal(androidBox.speechSynthesis.spoke, false);
assert.equal(typeof S.rollMissions, "function");
save.shell46.claimed.missions.kill = 1;
save.shell46.missionStamp.day = "2000-01-01";
S.rollMissions(save);
assert.equal(save.shell46.claimed.missions.kill, undefined);
save.kills = (save.kills || 0) + 10;
assert.equal(S.claimMission(save, "kill").ok, true);
save.coins = 400;
const ticketBefore = S.wallets(save).ticket;
const featured = S.buyFeatured(null, { save, commit() {}, toast() {}, feedback() {} }, "exchange", "coin-ticket");
assert.equal(featured.ok, true);
assert.equal(S.wallets(save).ticket, ticketBefore + 1);
const ticketSwap = S.exchange(save, "coin-ticket");
assert.equal(ticketSwap.ok, true);
assert.ok(S.wallets(save).ticket >= 2);

console.log("shell_unit ok");
