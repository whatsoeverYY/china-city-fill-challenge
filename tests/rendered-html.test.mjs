import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the city challenge shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>中国城市填充挑战<\/title>/i);
  assert.match(html, /中国城市填充挑战/);
  assert.match(html, /从一省出发/);
  assert.match(html, /34 个省级行政区/);
  assert.match(html, /地理知识馆/);
  assert.doesNotMatch(html, /codex-preview/);
});

test("includes map and interaction affordances", async () => {
  const [game, css, layout, gauntletData, universityData, confusableCityData, provinceCityCountData, provinceAdministrativeProfileData, knowledgeBase, knowledgeData, playerData, progressStorage, adminDashboard, supabaseMigration, xinjiangMapSource] = await Promise.all([
    readFile(new URL("../app/CityGame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/gauntlet-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/university-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/confusable-city-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/province-city-count-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/province-administrative-profile-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/KnowledgeBase.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/knowledge-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/PlayerDataProvider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/progress-storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/AdminDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608270001_player_accounts_and_progress.sql", import.meta.url), "utf8"),
    readFile(new URL("../public/data/maps/650000.json", import.meta.url), "utf8"),
  ]);

  const xinjiangMap = JSON.parse(xinjiangMapSource);
  assert.equal(xinjiangMap.features.length, 27);
  assert.deepEqual(
    xinjiangMap.features.slice(-3).map((feature) => [
      feature.properties.name,
      feature.properties.adcode,
    ]),
    [
      ["新星市", 659011],
      ["白杨市", 659012],
      ["草湖市", 659013],
    ],
  );

  assert.match(game, /draggable=\{!isPlaced\}/);
  assert.match(game, /data-region-name/);
  assert.match(game, /PROVINCES/);
  assert.match(game, /难度提升/);
  assert.match(game, /邻省连城/);
  assert.match(game, /PROVINCE_NEIGHBORS/);
  assert.match(game, /PROVINCE_FILL_COLORS/);
  assert.match(game, /显示全部城市/);
  assert.match(game, /makeProjection\(visibleFeatures\)/);
  assert.match(game, /map\.features\.filter[\s\S]*hiddenProvinceCodes\.has/);
  assert.match(game, /hiddenProvinceCodes/);
  assert.match(game, /toggleProvinceVisibility/);
  assert.match(game, /点击名称可隐藏/);
  assert.match(game, /过关斩将/);
  assert.match(game, /辨形识省/);
  assert.match(game, /城归何处/);
  assert.match(game, /省牌双答/);
  assert.match(game, /牌归省市/);
  assert.match(game, /邻省包围圈/);
  assert.match(game, /车牌补全/);
  assert.match(game, /省会攻防/);
  assert.match(game, /城市落点/);
  assert.match(game, /真假闪电/);
  assert.match(game, /邻省连锁/);
  assert.match(game, /省份拼图/);
  assert.match(game, /谁是卧底/);
  assert.match(game, /市域落点/);
  assert.match(
    game,
    /title: "市域落点"[\s\S]{0,220}target: "连续答对 30 题"/,
  );
  assert.match(game, /沿海与沿边/);
  assert.match(game, /最短省际路线/);
  assert.match(game, /地理排除/);
  assert.match(game, /旋转轮廓/);
  assert.match(game, /车牌找茬/);
  assert.match(game, /省会落点/);
  assert.match(game, /名校坐标/);
  assert.match(game, /写出这所大学所在的城市/);
  assert.match(game, /错题复仇赛/);
  assert.match(game, /双城迷阵/);
  assert.match(game, /省内穿越/);
  assert.match(game, /省市点兵/);
  assert.match(game, /多少座地级及以上城市/);
  assert.match(game, /终极混战/);
  assert.match(game, /GAUNTLET_TIME_LIMIT = 90/);
  assert.match(game, /极速模式 · 60 秒/);
  assert.match(game, /GauntletNationalMap/);
  assert.match(game, /GauntletDetailMap/);
  assert.match(game, /findShortestPath/);
  assert.match(game, /buildCityAdjacencyMap/);
  assert.match(game, /shuffleWithRandom/);
  assert.match(game, /summarizeQuestionsByProvince/);
  assert.match(game, /PROVINCE_BY_CODE/);
  assert.match(game, /setDraftPickerSelection/);
  assert.match(game, /gradeProvinceSelection/);
  assert.match(game, /clearProvinceView/);
  assert.doesNotMatch(game, /function shortestCityPath/);
  assert.doesNotMatch(game, /function shortestProvincePath/);
  assert.doesNotMatch(game, /function collectGeometryPointKeys/);
  assert.match(game, /createCityRouteChallenge/);
  assert.match(game, /GAUNTLET_MISTAKES_KEY/);
  assert.match(game, /recordMistake/);
  assert.match(game, /masterMistake/);
  assert.match(game, /createBossQuestions/);
  assert.match(game, /AnswerReviewPanel/);
  assert.match(game, /正确答案/);
  assert.match(game, /知识解释/);
  assert.match(game, /继续下一题/);
  assert.match(game, /BossSkillSummary/);
  assert.match(game, /已通过第/);
  assert.match(game, /三条生命、三十道均衡混合题/);
  assert.match(game, /PROVINCE_GROUP_QUESTIONS\.length/);
  assert.match(game, /PROVINCE_CAPITALS/);
  assert.match(game, /看车牌，答省市/);
  assert.match(game, /cityAnswer/);
  assert.match(game, /passedLevel < 26/);
  assert.match(game, /GAUNTLET_PROGRESS_KEY/);
  assert.match(game, /normalizePlate/);
  assert.match(game, /plateAnswerMatches/);
  assert.match(game, /全部车牌前缀/);
  assert.match(game, /answerMode: "all-plates"/);
  assert.match(game, /answerMode: "all-plate-letters"/);
  assert.match(game, /选择省份（可多选）/);
  assert.match(game, /selectedQuizProvinces/);
  assert.match(game, /selectedShapeProvinceCodes/);
  assert.match(game, /ALL_GAUNTLET_SHAPE_PROVINCE_CODES/);
  assert.match(game, /后续轮廓只会来自所选省份/);
  assert.match(game, /applyProvinceSelection/);
  assert.match(game, /nextSelection\.has\(item\.provinceShort\)/);
  assert.match(game, /useMapCollection/);
  assert.match(game, /return useMapCollection\(\[code\]\)/);
  assert.match(game, /fetchMapData/);
  assert.match(game, /ProvinceShape/);
  assert.match(game, /cityGroupsWithMinimum/);
  assert.match(game, /resetRoundProgress/);
  assert.match(game, /setCityChallengeQuestions/);
  assert.match(game, /advanceStreakChallenge/);
  assert.match(game, /GAUNTLET_LEVEL_13_HISTORY_KEY/);
  assert.match(game, /GAUNTLET_LEVEL_25_HISTORY_KEY/);
  assert.match(game, /CITY_MAP_RECENT_QUESTION_LIMIT = 90/);
  assert.match(game, /createCityMapQuestionQueue/);
  assert.match(game, /spreadCityQuestions/);
  assert.match(game, /rememberCityMapQuestion/);
  assert.match(game, /GauntletProvinceMapWall/);
  assert.match(game, /车牌落城/);
  assert.match(game, /二十六重试炼/);
  assert.match(game, /优先避开最近 90 道已出现题目/);
  assert.match(game, /答对后自动进入下一题；答错才会展示正确答案与知识解释/);
  assert.match(game, /不再依赖地图，直接根据省份名称判断/);
  assert.match(game, /neighbor-text-options/);
  assert.match(game, /NationalCityAtlas/);
  assert.match(game, /全国车牌图鉴/);
  assert.match(game, /KnowledgeBase/);
  assert.match(game, /地理知识馆/);
  assert.match(game, /knowledgeOpen/);
  assert.match(game, /PROVINCE_PLATE_PREFIXES/);
  assert.match(game, /atlasPointerPosition/);
  assert.match(game, /onWheel=\{handleWheel\}/);
  assert.match(game, /已辨认本轮所选的/);
  assert.match(game, /已完成本轮所选的/);
  assert.match(game, /已完成目标：/);
  assert.match(game, /submitManualAnswer/);
  assert.match(game, /manual-answer/);
  assert.match(game, /500 个待归位的名字/);
  assert.match(game, /OpenStreetMap contributors/);
  assert.match(css, /--red:\s*#b43b32/i);
  assert.match(css, /\.gauntlet-province-map-wall/);
  assert.match(css, /\.gauntlet-province-map-panel path\.is-correct-answer/);
  assert.match(css, /--green:\s*#2d7d5f/i);
  assert.match(css, /map-region\.is-province-tinted/);
  assert.match(css, /joined-province-strip > button\.is-hidden/);
  assert.match(css, /gauntlet-level-grid/);
  assert.match(css, /gauntlet-silhouette/);
  assert.match(css, /city-question\.is-plate-question/);
  assert.match(css, /province-picker-dialog/);
  assert.match(css, /province-picker-grid/);
  assert.match(css, /timed-mode-toggle/);
  assert.match(css, /gauntlet-national-region/);
  assert.match(css, /truth-actions/);
  assert.match(css, /province-route/);
  assert.match(css, /province-puzzle-piece/);
  assert.match(css, /gauntlet-detail-map/);
  assert.match(css, /gauntlet-option-grid/);
  assert.match(css, /boss-lives/);
  assert.match(css, /answer-review/);
  assert.match(css, /is-correct-answer/);
  assert.match(css, /boss-skill-summary/);
  assert.match(css, /university-question/);
  assert.match(css, /mistake-empty-state/);
  assert.match(css, /confusable-options/);
  assert.match(css, /is-city-route/);
  assert.match(css, /city-count-question/);
  assert.match(css, /neighbor-text-options button\.is-selected/);
  assert.match(css, /city-atlas-shell/);
  assert.match(css, /city-atlas-region/);
  assert.match(css, /city-atlas-province-outline/);
  assert.match(css, /city-atlas-toolbar/);
  assert.match(css, /knowledge-category-grid/);
  assert.match(css, /knowledge-neighbor-stage/);
  assert.match(css, /knowledge-river-card/);
  assert.match(css, /knowledge-special-regions/);
  assert.match(css, /knowledge-plate-grid article\.is-multi-plate/);
  assert.match(knowledgeBase, /中国地理知识馆/);
  assert.match(knowledgeBase, /关卡知识覆盖/);
  assert.match(knowledgeBase, /CITY_QUIZ_DATA/);
  assert.match(knowledgeBase, /UNIVERSITY_QUIZ_DATA/);
  assert.match(knowledgeBase, /PROVINCE_CITY_COUNT_DATA/);
  assert.match(knowledgeBase, /getProvinceAdministrativeProfile/);
  assert.match(knowledgeBase, /综合总量/);
  assert.match(knowledgeBase, /特殊车牌辖区/);
  assert.match(knowledgeBase, /MULTI_PLATE_CITY_COUNT/);
  assert.match(knowledgeBase, /关卡中必须全部答出/);
  assert.match(knowledgeBase, /CONFUSABLE_CITY_PAIRS/);
  assert.match(knowledgeData, /KNOWLEDGE_CATEGORIES/);
  assert.match(knowledgeData, /RIVER_KNOWLEDGE/);
  assert.match(knowledgeData, /省份全景名片/);
  assert.match(knowledgeData, /城市与车牌密码/);
  assert.match(knowledgeData, /985 · 211 名校坐标/);
  assert.match(knowledgeData, /陆地邻省关系/);
  assert.match(knowledgeData, /每省有几座城市/);
  assert.match(knowledgeData, /长江 · 黄河路线/);
  assert.match(knowledgeData, /易混城市辨析/);
  assert.match(knowledgeData, /地图落点与路线诀窍/);
  assert.match(knowledgeData, /青藏川滇渝，鄂湘赣皖苏沪/);
  assert.match(knowledgeData, /青川甘宁内蒙古，陕晋豫鲁入渤海/);
  assert.match(layout, /PlayerDataProvider/);
  assert.match(playerData, /signInWithPassword/);
  assert.match(playerData, /游客试玩不会保存进度/);
  assert.match(playerData, /离线游玩中，联网后会自动同步/);
  assert.match(playerData, /进入管理员后台/);
  assert.doesNotMatch(playerData, /from ["']next\/link["']/);
  assert.match(playerData, /<a href=\{adminPath\(\)\}/);
  assert.match(progressStorage, /createUserProgressStorage/);
  assert.match(progressStorage, /mergeProgressSnapshots/);
  assert.match(progressStorage, /LEGACY_CLAIM_KEY/);
  assert.match(adminDashboard, /玩家与进度中心/);
  assert.match(adminDashboard, /查看完整存档 JSON/);
  assert.doesNotMatch(adminDashboard, /from ["']next\/link["']/);
  assert.match(adminDashboard, /<a href=\{appPath\("\/"\)\}/);
  assert.match(supabaseMigration, /enable row level security/);
  assert.match(supabaseMigration, /profiles_select_self_or_admin/);
  assert.match(supabaseMigration, /progress_update_self/);
  assert.match(supabaseMigration, /progress_backups/);
  assert.match(gauntletData, /CITY_QUIZ_DATA/);
  assert.match(gauntletData, /苏A/);
  assert.match(gauntletData, /\["苏E", "苏U"\]/);
  assert.match(gauntletData, /\["粤E", "粤X", "粤Y"\]/);
  assert.match(gauntletData, /\["浙A", "浙M"\]/);
  assert.match(gauntletData, /plateAnswerMatches/);
  assert.match(gauntletData, /MULTI_PLATE_CITY_COUNT/);
  assert.match(universityData, /UNIVERSITY_QUIZ_DATA/);
  assert.match(universityData, /北京大学/);
  assert.match(universityData, /石河子大学/);
  assert.match(universityData, /学校在北京、保定两地办学/);
  assert.equal(
    universityData.match(/^\s+\["[^"]+", "[^"]+", "(?:985|211)"/gm)?.length,
    115,
  );
  assert.equal(
    universityData.match(/^\s+\["[^"]+", "[^"]+", "985"/gm)?.length,
    39,
  );
  assert.match(confusableCityData, /CONFUSABLE_CITY_PAIRS/);
  assert.match(confusableCityData, /苏州市/);
  assert.match(confusableCityData, /宿州市/);
  assert.equal(
    confusableCityData.match(/memoryTip: "/g)?.length,
    12,
  );
  const mainlandCityCounts = Array.from(
    provinceCityCountData.matchAll(/mainland\("\d+",\s*"[^"]+",\s*"[^"]+",\s*(\d+)/g),
    (match) => Number(match[1]),
  );
  assert.equal(mainlandCityCounts.length, 31);
  assert.equal(mainlandCityCounts.reduce((total, count) => total + count, 0), 297);
  assert.match(provinceCityCountData, /台湾地区有6个‘直辖市’和3个市，共9座城市/);
  assert.match(provinceCityCountData, /香港特别行政区现行划分为18区/);
  assert.match(provinceCityCountData, /PROVINCE_CITY_COUNT_DATA/);
  assert.match(provinceAdministrativeProfileData, /PROVINCE_ADMINISTRATIVE_PROFILE_DATA/);
  assert.match(
    provinceAdministrativeProfileData,
    /"420000",\s*17,[\s\S]*?恩施土家族苗族自治州[\s\S]*?神农架林区/,
  );
  assert.match(provinceAdministrativeProfileData, /雄安新区[\s\S]*?冀X/);
  assert.match(provinceAdministrativeProfileData, /杨凌农业高新技术产业示范区[\s\S]*?陕V/);
  assert.match(provinceAdministrativeProfileData, /阿拉善盟[\s\S]*?蒙M/);
  assert.match(
    provinceAdministrativeProfileData,
    /"460000",\s*19,[\s\S]*?省直辖县级市[\s\S]*?省直辖县[\s\S]*?省直辖自治县/,
  );
  assert.match(
    provinceAdministrativeProfileData,
    /"820000",\s*8,[\s\S]*?堂区[\s\S]*?路凼填海区/,
  );
  assert.match(
    provinceAdministrativeProfileData,
    /"650000",\s*27,[\s\S]*?自治区直辖县级市", count: 13[\s\S]*?昆玉市[\s\S]*?新S[\s\S]*?草湖市/,
  );
  assert.match(layout, /lang="zh-CN"/);
});
