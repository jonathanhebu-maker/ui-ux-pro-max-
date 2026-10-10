# תוכנית הפעולה המלאה — מה להתקין ומה לעשות, לפי הסדר

> נבנה מתוך המדריכים של erikdayan.com, עם כל פקודה מאומתת מול המקור הרשמי שלה (GitHub / התיעוד של Anthropic).
> עודכן: אוקטובר 2026.

---

## מה כבר מותקן לך בפרויקט הזה (עשיתי בשבילך)

| מה | איפה | מה זה נותן |
|---|---|---|
| הסקיל **ui-ux-pro-max** (חולץ מה-ZIP) | `.claude/skills/ui-ux-pro-max` + כל הריפו | מאגר עיצוב: 79 סגנונות, 192 פלטות צבעים, 74 זוגות פונטים, 25 גרפים, 22 סטאקים |
| 6 סקילים נלווים שהגיעו איתו | `.claude/skills/` | banner-design, brand, design, design-system, slides, ui-styling |
| **frontend-design** (רשמי של Anthropic) | `.claude/skills/frontend-design` | עיצוב ממשקים לא-גנריים — חשיבה עיצובית לפני קוד |
| **find-skills** (Vercel Labs) | `.claude/skills/find-skills` | "הסקיל שמוצא סקילים" — מבקשים מקלוד למצוא ולהתקין סקיל |
| **karpathy-guidelines** | `.claude/skills/karpathy-guidelines` | הקובץ המפורסם (218 אלף כוכבים) שאומר לקלוד מה *לא* לעשות |

**בדיקת אבטחה:** כל הסקילים נסרקו עם SkillSpector של NVIDIA (סריקה סטטית). הציונים של השלושה החדשים: 0–13 מתוך 100 (נקי). הסקילים של ui-ux-pro-max קיבלו התרעות-שווא צפויות (סקיל עתיר קוד), ובדיקה ידנית אישרה: אין שליחת מידע החוצה — כל ההפניות לרשת הן ל-Google Fonts בלבד.

---

## שלב 1 — הבסיס במחשב שלך (10 דקות, פעם אחת)

1. **התקן Claude Code** (אם עדיין אין לך):
   - Mac / Linux: `curl -fsSL https://claude.ai/install.sh | bash`
   - Windows (PowerShell): `irm https://claude.ai/install.ps1 | iex`
   - בדיקה: `claude --version`
2. **פתח את הפרויקט הזה**: שכפל את הריפו למחשב, היכנס לתיקייה והרץ `claude` — כל הסקילים שלמעלה יעבדו אוטומטית.
3. **חבר את Gmail ויומן Google** (החיבור הכי משתלם, בלי שום התקנה):
   - claude.ai או Claude Desktop ← Settings ← **Connectors** ← Connect ליד Gmail / Google Calendar.
4. **הפעל את Cowork** — "העובד הדיגיטלי": הורד את Claude Desktop מ-claude.com/cowork ובחר Cowork. נותנים לו משימה שלמה (מחקר, מסמכים, קבצים) והוא עובד לבד. כלול בכל מנוי בתשלום.

## שלב 2 — פקודות בסיס בתוך Claude Code (5 דקות)

| פקודה | מה היא עושה |
|---|---|
| `/init` | יוצרת קובץ CLAUDE.md לפרויקט — הזיכרון הקבוע של קלוד (כבר קיים בפרויקט הזה) |
| `/model` | בחירת מוח: sonnet ליומיום, opus למורכב, fable לקשה ביותר (חצים ימינה/שמאלה = רמת effort) |
| `/permissions` | מה מותר לקלוד בלי לשאול כל פעם |
| `#` בתחילת שורה | שומר הערה ישר ל-CLAUDE.md — "ללמד" את קלוד תוך כדי עבודה |
| `/doctor` | בדיקת תקינות כשקלוד "מפסיק להקשיב" — מאתר הגדרות סותרות ומציע תיקונים |

## שלב 3 — חבילות הפלאגינים (העתק-הדבק, בתוך Claude Code במחשב שלך)

1. **Agent Skills של Addy Osmani** (104 אלף כוכבים) — קלוד עובד כמו מהנדס סניור:
   ```
   /plugin marketplace add addyosmani/agent-skills
   /plugin install agent-skills@addy-agent-skills
   ```
   הערה: שני סקילים מתוך ה-25 (`security-and-hardening`, `browser-testing-with-devtools`) קיבלו ציון סיכון גבוה בסורק של NVIDIA — כנראה התרעות-שווא (תוכן שמדבר *על* אבטחה), אבל אם בא לך להיות זהיר אפשר להשבית אותם אחרי ההתקנה.
2. **Compound Engineering של Every** (25 אלף כוכבים) — קלוד שלומד מכל פרויקט, לולאת 6 שלבים:
   ```
   /plugin marketplace add EveryInc/compound-engineering-plugin
   /plugin install compound-engineering
   ```
3. **הסקילים הרשמיים של Anthropic** (מסמכים: Word/PDF/PowerPoint/Excel ועוד):
   ```
   /plugin marketplace add anthropics/skills
   /plugin install example-skills@anthropic-agent-skills
   /plugin install document-skills@anthropic-agent-skills
   ```
4. **זיכרון קבוע בין שיחות — claude-mem** (99 אלף כוכבים):
   ```
   /plugin marketplace add thedotmack/claude-mem
   /plugin install claude-mem
   ```
   (ולהפעיל מחדש את Claude Code)

## שלב 4 — אבטחה: לסרוק כל סקיל לפני התקנה

26% מהסקילים בשוק מכילים חולשה, 5% זדוניים. הסורק של NVIDIA, חינם:
```
uv tool install git+https://github.com/NVIDIA/skillspector.git
skillspector scan <כתובת-גיטהאב-או-תיקייה> --no-llm
```
ציון 0–50 = סביר. **51 ומעלה = לא להתקין** בלי בדיקה ידנית.
(דורש את הכלי uv — מתקינים עם `curl -LsSf https://astral.sh/uv/install.sh | sh`)

## שלב 5 — כלים מתקדמים (כשתהיה מוכן)

| כלי | מה זה | איך |
|---|---|---|
| **Claude Design** | אבות-טיפוס, מצגות וויזואלים בתיאור חופשי | כבר זמין במנוי שלך בתוך claude.ai — אין מה להתקין |
| **screenshot-to-code** (80 אלף כוכבים) | צילום מסך/Figma ← קוד עובד | `git clone https://github.com/abi/screenshot-to-code` ואז Docker: `docker-compose up -d --build` (דורש מפתח API) |
| **Agent Reach** | גישה ל-YouTube/GitHub/טוויטר בלי API | `pipx install https://github.com/Panniantong/agent-reach/archive/main.zip && agent-reach install --env=auto` |
| **Twenty CRM** | CRM קוד פתוח עם סוכן AI | הכי פשוט: הענן שלהם ב-twenty.com; התקנה עצמית דורשת שרת Docker |
| **Meta Ads MCP** | ניהול קמפיינים מהצ'אט | claude.ai ← Settings ← Connectors ← Add Integration ← `https://meta-ads.mcp.pipeboard.co/` (זהירות עם הרשאות כתיבה) |
| **Higgsfield** | וידאו AI מהצ'אט | Connectors ← Add custom connector ← `https://mcp.higgsfield.ai/mcp` (דורש מנוי Higgsfield) |
| **Hermes Agent** | סוכן טרמינל חינמי לכל מודל | `curl -fsSL https://hermes-agent.nousresearch.com/install.sh \| bash` |

## שלב 6 — ללמוד לדבר עם המודל החדש

המדריך הרשמי של Anthropic לפרומפטינג של Fable 5:
https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5

---

## סדר מומלץ לשבוע הראשון

- **יום 1:** שלב 1 + שלב 2 (הבסיס)
- **יום 2:** שלב 3 סעיפים 1+3 (Addy + סקילים רשמיים) ולעבוד איתם יום שלם
- **יום 3:** שלב 3 סעיפים 2+4 (Compound Engineering + זיכרון)
- **יום 4:** שלב 4 (להתרגל לסרוק לפני כל התקנה חדשה)
- **יום 5 והלאה:** שלב 5 לפי הצורך האמיתי שלך — לא להתקין דברים "ליתר ביטחון"
