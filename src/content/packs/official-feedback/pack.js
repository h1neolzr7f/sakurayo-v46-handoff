(function () {
  "use strict";
  window.SakurayoContent.register({
    id: "official.feedback",
    version: 1,
    apiVersion: 2,
    game: { min: "4.2.0", maxExclusive: "5.0.0" },
    dependencies: [],
    conflicts: [],
    title: "官方打击反馈包",
    description: "离线 UI 音效、奖励反馈和轻量战斗 VFX。缺失时自动退回本体程序化效果。",
    assets: {
      audio: {
        click: "content-packs/official-feedback/audio/ui-click.ogg",
        reward: "content-packs/official-feedback/audio/reward.ogg",
        error: "content-packs/official-feedback/audio/error.ogg",
        phase: "content-packs/official-feedback/audio/phase.ogg",
        boss: "content-packs/official-feedback/audio/boss.ogg",
        open: "content-packs/official-feedback/audio/open.ogg",
        close: "content-packs/official-feedback/audio/close.ogg"
      },
      vfx: {
        muzzle: "content-packs/official-feedback/vfx/muzzle.png",
        rewardStar: "content-packs/official-feedback/vfx/reward-star.png",
        slash: "content-packs/official-feedback/vfx/slash.png"
      }
    }
  });
})();
