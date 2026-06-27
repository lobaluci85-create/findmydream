import React, { useState, useMemo, useEffect } from "react";
import { Moon, Flame, Sparkles, Loader2, BookOpen, Send, Lock } from "lucide-react";

const C = { midnight:"#17110B", panel:"#241910", panel2:"#302316", ember:"#C8612E", gold:"#E3B23C", moon:"#ECE0CB", muted:"#A38A66", line:"#3A2A1A" };

const TRADITIONS = [
  { id:"all", label:"All" },
  { id:"jungian", label:"Jungian" },
  { id:"orthodox", label:"Orthodox & folk" },
  { id:"islamic", label:"Islamic (Ta'bir)" },
  { id:"hindu", label:"Hindu" },
  { id:"chinese", label:"Chinese" },
  { id:"greek", label:"Greek" },
  { id:"buddhist", label:"Buddhist" },
  { id:"sumerian", label:"Sumerian" },
];

// ── Symbol dictionary. Core notes per entry: j/o/i. Extra traditions live in EXTRA below. ──
// j = Jungian · o = Orthodox Christian & folk · i = Ta'bir (classical Islamic)
const DICT = [
  { k:"dog", syn:["dog","puppy","hound","hounds"], animal:true, arch:"The Companion & the Shadow",
    sum:"A dog points to loyalty and instinct — and sometimes to the part of you, or the person near you, that you'd rather not face.",
    j:"Jung saw the dog as the faithful companion and instinct made loyal — but also the shadow self when it turns on you. Its mood tells you whether you're at peace with your instincts or at war with them; a biting dog asks what you've been keeping at bay.",
    o:"Folk reads a friendly dog as a true friend or protector, and a hostile or biting one as a false friend or a betrayal close by. At heart it is a symbol about trust — who deserves yours.",
    i:"Ibn Sirin reads the dog as a coarse, lowly person or a weak enemy; a biting dog signals harm or slander from someone who resents you, while a calm dog is a loyal, if humble, ally." },
  { k:"snake", syn:["snake","snakes","serpent","serpents"], animal:true, arch:"The Transformer",
    sum:"The snake is danger and renewal at once — it sheds its skin to become new.",
    j:"Jung saw the snake as the raw energy of transformation and buried instinct; because it sheds its skin, it often marks a change you're undergoing, whether you welcome it or fear it. A threatening snake can be the shadow asking to be met.",
    o:"In scripture the serpent is temptation and the hidden adversary; folk belief reads it as a concealed enemy or a deceit close to you. Killing it in the dream is overcoming that danger.",
    i:"Ibn Sirin most often reads the snake as an enemy, its size and colour marking how strong or near; defeating it foretells victory, while its bite can mean harm from someone who envies you." },
  { k:"water", syn:["water","sea","ocean","river","lake","flood","drown","drowning","swim","swimming","wave","waves"], arch:"The Depths",
    sum:"Water mirrors emotion and the unconscious — calm or rising, it shows your inner weather.",
    j:"Water is the classic image of the unconscious and of feeling itself, so how it moves is how your emotions move. Calm, clear water suggests inner clarity; rough, murky, or rising water points to turbulence you haven't yet named, and drowning to feeling overwhelmed.",
    o:"In scripture and folk belief water is grace, cleansing, and life — clear water a blessing, muddy or rising water a warning of sorrow pressing in. Crossing it safely is a passage through trial.",
    i:"In Ta'bir, clear sweet water is lawful provision, faith, and relief (barakah); murky, salty, or stagnant water points to confusion, hardship, or a test, and drinking it can mean spiritual nourishment." },
  { k:"teeth", syn:["teeth","tooth"], arch:"Loss & Power",
    sum:"Teeth carry power and appearance — losing them is the fear of losing your grip.",
    j:"Teeth let you bite, speak, and be seen, so losing them is the fear of losing control, status, or your footing. The anxiety is usually about a change you can't stop, or words you're afraid to say or take back.",
    o:"Folk tradition famously ties falling teeth to a loss or a death in the family, or to hard news arriving. It's read as a call to hold your household close.",
    i:"In Ta'bir, teeth can stand for relatives and one's lifespan; losing them may mean the passing of kin, the settling of a debt, or — by some readings — long life, with the detail deciding." },
  { k:"falling", syn:["fall","falling","fell","dropping"], arch:"Letting Go",
    sum:"Falling is the body's image of losing control.",
    j:"Falling is insecurity, overwhelm, or a part of you that needs to release its grip rather than clutch tighter. Where you fall from often mirrors what feels precarious in your waking life right now.",
    o:"Folk reads falling as a warning to steady your footing, and sometimes as a fear of disgrace or decline; the remedy it points to is humility and care.",
    i:"A fall can signal a setback or a drop from a position or standing — one to guard against; landing unhurt softens the omen." },
  { k:"flying", syn:["fly","flying","flew","soar","soaring","floating"], arch:"Ascent",
    sum:"Flying is freedom — how easily you fly is how free you feel.",
    j:"Flying is freedom and ambition — rising above limits — and how easily you stay aloft mirrors how free or held-back you feel. Struggling to fly points to obstacles or self-doubt weighing on you.",
    o:"Folk and spiritual tradition reads flying as a lifting up, good news, and rising fortune, so long as the flight is calm — a movement toward the higher things.",
    i:"In Ta'bir, steady flight toward the sky often means travel or a rise in standing; reckless or falling flight turns it into overreach." },
  { k:"chase", syn:["chase","chased","chasing","pursued","followed","running away"], arch:"Avoidance",
    sum:"Being chased is something in waking life you're trying to outrun.",
    j:"Being chased is something you're running from — and who or what pursues you names what you're avoiding, often a feeling or truth you don't want to turn and meet. The relief only comes when you stop and face it.",
    o:"Folk reads pursuit as a push to confront a trouble you've been dodging, and a call not to let fear set your direction.",
    i:"In Ta'bir, a pursuer is an enemy or a worry pressing on you; escaping it in the dream foretells relief and safety." },
  { k:"death", syn:["death","dead","dying","die","funeral","corpse","grave"], arch:"Endings & Renewal",
    sum:"Death in dreams rarely means death — it means a chapter closing and another opening.",
    j:"Death in a dream is rarely literal; it marks the end of one chapter and the birth of a new identity — the old self making room for who you're becoming. It often surfaces during real transitions.",
    o:"Folk tradition frequently reverses a death dream into long life or a coming change rather than a literal omen — transformation, not loss.",
    i:"In Ta'bir a death dream often means a transition, repentance, or even long life; the mood — peaceful or fearful — decides whether it reads as glad tidings or a warning." },
  { k:"baby", syn:["baby","babies","infant","newborn"], arch:"New Beginnings",
    sum:"A baby is something new in you, fragile and needing care.",
    j:"A nascent self, idea or project in its earliest, most vulnerable form.",
    o:"Innocence and blessing; folk links babies to news and fresh starts.",
    i:"Often joy, provision, and relief from worry." },
  { k:"fire", syn:["fire","fires","burning","burn","flame","flames"], arch:"The Hearth & the Blaze",
    sum:"Fire warms or consumes — passion and destruction share the same flame.",
    j:"Passion, anger, or transformation; energy that can heal or devour.",
    o:"Purification and the divine, but also a warning of conflict and loss.",
    i:"Can mean discord or unlawful gain when destructive; a contained flame can mean guidance." },
  { k:"house", syn:["house","home","houses","room","rooms"], arch:"The Self",
    sum:"A house is you — its rooms are the parts of who you are.",
    j:"The psyche itself; unknown rooms are parts of you not yet discovered.",
    o:"Your inner state and household; a sound house means a steady soul.",
    i:"The dreamer's life, body or family; its condition reflects your circumstances." },
  { k:"car", syn:["car","cars","driving","vehicle","truck"], arch:"Your Direction",
    sum:"A car is how much control you feel over where your life is going.",
    j:"Agency and direction; brakes or crashes mirror felt loss of control.",
    o:"The path you're on; recklessness at the wheel is a warning.",
    i:"Your means and movement through affairs; a smooth ride is progress." },
  { k:"naked", syn:["naked","nude","undressed"], arch:"Exposure",
    sum:"Being naked is the fear — or the wish — of being fully seen.",
    j:"Vulnerability and fear of judgment, or a longing to be known as you are.",
    o:"Shame or stripped pretense; folk warns of gossip around you.",
    i:"Exposure of a hidden matter, or freedom from pretension, depending on the feeling." },
  { k:"exam", syn:["exam","test","unprepared","classroom","school"], arch:"Being Tested",
    sum:"An exam dream is self-judgment under pressure.",
    j:"Fear of falling short when you feel scrutinized.",
    o:"A trial of conscience and a call to prepare.",
    i:"A test of faith or duty you feel unready for." },
  { k:"money", syn:["money","gold","coins","cash","wealth","treasure","lottery"], arch:"Worth & Provision",
    sum:"Money is what you value — and what you fear losing.",
    j:"Self-worth and vital energy; what you treasure most.",
    o:"Folk is wary: found money can foretell loss or worry, not gain.",
    i:"Often speech or worry; gold can be burden or blessing by context." },
  { k:"cat", syn:["cat","cats","kitten"], animal:true, arch:"The Independent",
    sum:"The cat is intuition, independence, and a little cunning.",
    j:"The independent, intuitive, often feminine instinct.",
    o:"Folk frequently links cats to a sly or deceitful person near you.",
    i:"Often a thief or a cunning person in your circle." },
  { k:"spider", syn:["spider","spiders","web","cobweb"], animal:true, arch:"The Weaver",
    sum:"The spider is the web — creation, or the feeling of being trapped in one.",
    j:"A creative web you're spinning, or entrapment and the devouring mother.",
    o:"Folk reads webs as entanglement and scheming around you.",
    i:"A weak but troublesome enemy, or tangled affairs." },
  { k:"bird", syn:["bird","birds","eagle","dove","crow","raven"], animal:true, arch:"Spirit & Message",
    sum:"A bird carries the soul and its messages.",
    j:"Aspiration and messages rising from the unconscious.",
    o:"The dove is peace and the Spirit; crows and ravens warn of bad news.",
    i:"Often news, travel, or souls; a high-flying bird can mean honor." },
  { k:"fish", syn:["fish","fishes","fishing"], animal:true, arch:"Hidden Gifts",
    sum:"Fish are gifts surfacing from the deep.",
    j:"Insights rising from the unconscious into view.",
    o:"Folk sees fish as provision and news, sometimes a pregnancy.",
    i:"Provision and lawful gain, especially fresh fish." },
  { k:"blood", syn:["blood","bleeding","bleed"], arch:"Life & Loss",
    sum:"Blood is life force — and the wound that asks for attention.",
    j:"Vitality, sacrifice, or a hurt demanding to be tended.",
    o:"Kinship and life; spilled blood warns of conflict or loss.",
    i:"Often unlawful wealth or a fault to repent, by context." },
  { k:"mother", syn:["mother","mom","mum","mama"], arch:"The Mother",
    sum:"The mother is care, origin, and conscience.",
    j:"The nurturing — or devouring — maternal archetype within you.",
    o:"Care, the family hearth, and the voice of conscience.",
    i:"Comfort, origin and provision; her state mirrors your security." },
  { k:"father", syn:["father","dad","papa"], arch:"The Father",
    sum:"The father is authority and structure.",
    j:"The rule-giving archetype: order, law, and protection.",
    o:"Protection and moral order in the household.",
    i:"Authority and provision; guidance you lean on or resist." },
  { k:"wedding", syn:["wedding","marriage","married","bride","groom"], arch:"Union",
    sum:"A wedding is the joining of two halves into one.",
    j:"The union of opposites within — integration of the self.",
    o:"Folk is split: a joyful wedding can paradoxically warn of sorrow.",
    i:"A binding commitment or major contract — by some, illness, by context." },
  { k:"pregnancy", syn:["pregnant","pregnancy","expecting"], arch:"Becoming",
    sum:"Pregnancy is something gestating in you, not yet born.",
    j:"A project, idea, or self quietly growing toward birth.",
    o:"New life and blessing on the way, sometimes literal news.",
    i:"Increase, hidden matters coming to light, or growing responsibility." },
  { k:"mountain", syn:["mountain","mountains","climbing","climb","peak","hill"], arch:"The Ascent",
    sum:"The mountain is the goal and the effort it costs.",
    j:"A goal and an obstacle — the labor of becoming yourself.",
    o:"Drawing nearer to the heights and to God; effort rewarded.",
    i:"A person of high rank, or a hard aim reached through effort." },
  { k:"forest", syn:["forest","woods","jungle","trees"], arch:"The Unknown Self",
    sum:"The forest is the unmapped part of you.",
    j:"The unconscious wilderness; getting lost is meeting the unknown self.",
    o:"Folk sees the dark wood as confusion or a trial to pass through.",
    i:"Tangled affairs, or refuge — depending on whether you find your way." },
  { k:"road", syn:["road","path","journey","street","crossroad","crossroads"], arch:"The Journey",
    sum:"The road is your life's direction and the choices on it.",
    j:"Direction and the choices laid before you.",
    o:"The path of life; a fork asks for a moral choice.",
    i:"Your course in life and faith; a clear road is right guidance." },
  { k:"door", syn:["door","doors","gate","gates","key","keys"], arch:"Threshold",
    sum:"A door is a passage between one phase and the next.",
    j:"An opening or transition asking to be entered.",
    o:"An opportunity; a locked door warns of obstacles ahead.",
    i:"An opening in affairs, a way granted, or the woman of the house." },
  { k:"light", syn:["light","sunlight","bright","glow","lamp"], arch:"Illumination",
    sum:"Light is clarity breaking through.",
    j:"Consciousness and insight reaching what was dark.",
    o:"Grace, truth, and the divine presence.",
    i:"Guidance, faith, and relief from darkness." },
  { k:"mirror", syn:["mirror","reflection"], arch:"The Reflected Self",
    sum:"A mirror shows you back to yourself.",
    j:"Self-image and the meeting with who you really are.",
    o:"Folk warns mirrors can reveal truth or misfortune.",
    i:"Your inner state shown back; a clear mirror is honesty." },
  { k:"wolf", syn:["wolf","wolves"], animal:true, arch:"The Wild",
    sum:"The wolf is untamed instinct and the outsider.",
    j:"Raw instinct, the outsider, or a threat from the wild self.",
    o:"Folk reads the wolf as a thief or a greedy, dangerous person.",
    i:"A tyrant, a thief, or a deceitful enemy." },
  { k:"horse", syn:["horse","horses","riding"], animal:true, arch:"Drive & Nobility",
    sum:"The horse is vital drive — power harnessed or wild.",
    j:"Powerful instinct and life-force, reined in or running free.",
    o:"Strength and honor; a runaway horse warns of ungoverned passion.",
    i:"Often status, fortune, or a spouse, by the horse's quality." },
  { k:"hair", syn:["hair","bald","balding","haircut"], arch:"Vitality & Identity",
    sum:"Hair is identity and strength — losing it is the fear of losing your grip, or your image.",
    j:"Identity, vitality and control; falling hair often mirrors stress and a fear of being exposed.",
    o:"Hair is glory and strength, as in Samson; losing it warns of lost standing or turbulence at home.",
    i:"Often linked to worry, hardship or a dip in status; by some readings, cut hair means burdens cleared." },
  { k:"crying", syn:["crying","cry","weeping","weep","tears","sobbing"], arch:"Release",
    sum:"Tears in a dream are usually a release the waking self has been holding back.",
    j:"An emotional release the daytime mind suppresses; weeping in dreams tends to relieve, not predict.",
    o:"A loosening of sorrow; folk often reads quiet weeping as relief on the way.",
    i:"Quiet tears can mean ease after hardship; loud wailing can warn of trouble." },
  { k:"lost", syn:["lost","maze","wandering","can't find","cannot find","searching"], arch:"Disorientation",
    sum:"Being lost is searching for a direction — or a part of yourself — you've misplaced.",
    j:"A search for direction, or a missing piece of who you are.",
    o:"A soul seeking its path; a gentle call to return to your center.",
    i:"Confusion in affairs or faith; finding the way again foretells guidance." },
  { k:"stairs", syn:["stairs","staircase","ladder","elevator","lift","steps"], arch:"Rising & Falling",
    sum:"Stairs move you between the levels of yourself — up toward a goal, down into the depths.",
    j:"Ascent or descent through layers of the psyche; climbing is effort, descending is going inward.",
    o:"Climbing toward higher things; descending can warn of decline.",
    i:"Rank and station — ascending means rising in standing, descending the reverse." },
  { k:"ring", syn:["ring","rings"], arch:"Bond & Commitment",
    sum:"A ring is a bond — commitment, union, the circle that holds.",
    j:"Wholeness and commitment; the self bound to a promise.",
    o:"Covenant and union; a lost ring warns of a bond under strain.",
    i:"Often authority, marriage or a binding matter; its quality reflects the affair." },
  { k:"snow", syn:["snow","snowing","ice","frozen","winter"], arch:"Stillness",
    sum:"Snow is a hush — feelings frozen, or a clean white page over the past.",
    j:"Feeling frozen, or a fallow, resting season of the self.",
    o:"Purity and a covering of what was; folk links snow to a clean slate, or hardship when heavy.",
    i:"By some readings provision and ease, by others stalled affairs — the feeling decides." },
  { k:"storm", syn:["storm","rain","raining","thunder","lightning","tempest"], arch:"Turbulence",
    sum:"A storm is emotion breaking — or tension about to clear.",
    j:"Emotional turbulence surfacing, or pressure finally releasing.",
    o:"Trial and cleansing; rain can be mercy or trouble by its force.",
    i:"Rain is often mercy and provision; a violent storm warns of upheaval." },
  { k:"war", syn:["war","battle","fighting","fight","soldiers","gun","bomb"], arch:"Conflict",
    sum:"War is conflict — most often between two parts of yourself.",
    j:"Inner conflict between opposing drives within you.",
    o:"A spiritual struggle; a call to guard your peace.",
    i:"Discord or a real dispute to be wary of; context shows the source." },
  { k:"phone", syn:["phone","call","calling","message","text","texting"], arch:"The Message",
    sum:"A phone is a reaching-out — a message trying to get through.",
    j:"A part of you trying to reach another, or a message from the unconscious.",
    o:"News or a connection sought; a dropped call warns of a strained tie.",
    i:"News arriving, or words and speech to weigh with care." },
  { k:"insects", syn:["insect","insects","bee","bees","ant","ants","bug","bugs"], animal:true, arch:"Small Troubles",
    sum:"Insects are the small things — irritations multiplying at the edges.",
    j:"Minor anxieties or irritations breeding in the background.",
    o:"Folk reads swarms as nagging troubles or gossip around you.",
    i:"Bees can mean industrious provision or a crowd; biting insects, petty enemies." },
  { k:"worm", syn:["worm","worms","earthworm","earthworms","maggot","maggots"], animal:true, arch:"Decay & Renewal",
    sum:"A worm works unseen, in the soil and the dark — it is both decay and the quiet renewal that grows out of it.",
    j:"Worms can be the small anxieties gnawing at you from below awareness, or a sense of smallness you'd rather not admit. Yet they are also nature's composters, turning what's dead into fertile ground — so they often mark a slow, unglamorous renewal already underway beneath the surface.",
    o:"Folk and scripture tie worms to decay and the grave, and to humility before it; but earthworms in good soil are read instead as fertility, patient work, and growth quietly on its way.",
    i:"Ibn Sirin often reads worms as one's children or dependents, and earthworms as provision and livelihood; worms leaving the body mean relief from distress, while a mass of them can point to weak, hidden troublemakers to watch." },
  { k:"knife", syn:["knife","knives","blade","sword","weapon","dagger"], arch:"The Blade",
    sum:"A blade is a cut — a hard truth, a severance, or aggression turned in or out.",
    j:"A cutting truth, a clean break, or aggression seeking direction.",
    o:"Division and conflict; a warning to guard your tongue and temper.",
    i:"Often wounding words, a quarrel, or strength depending on how it's used." },
  { k:"church", syn:["church","mosque","temple","cathedral","monastery","shrine","chapel"], arch:"The Sanctuary",
    sum:"A place of worship is the seat of faith, conscience, and refuge within you.",
    j:"The Self's sacred center — a call inward to what you hold holy.",
    o:"Faith, sanctuary, and the soul's home; entering it is a turn toward grace.",
    i:"A mosque points to faith, guidance and gathering; a house of worship in good order is religion well-kept." },
  { k:"cross", syn:["cross","icon","icons","candle","candles","praying","prayer","altar"], arch:"Faith & Protection",
    sum:"A cross, icon or candle is faith made visible — protection, repentance, and light against the dark.",
    j:"A symbol of wholeness and of bearing a burden toward meaning.",
    o:"In Orthodox tradition the cross and icon are protection and grace; a lit candle is prayer taking form.",
    i:"Acts of devotion in a dream point to sincerity of faith and a heart turning toward what is right." },
  { k:"angel", syn:["angel","angels"], arch:"The Messenger",
    sum:"An angel is guidance and glad tidings — a message from beyond the everyday self.",
    j:"A higher guiding figure of the psyche; the call of conscience or vocation.",
    o:"A guardian and bearer of God's word; comfort, protection, or a summons to the good.",
    i:"Angels in dreams are glad tidings, support, and a sign of being on a sound path." },
  { k:"cow", syn:["cow","cows","cattle","bull","ox","oxen","calf"], animal:true, arch:"Provision & Years",
    sum:"Cattle are provision and the seasons of plenty or want — as in Joseph's seven fat and seven lean cows.",
    j:"Nourishment, the maternal earth, and the slow cycles of abundance.",
    o:"Folk and scripture read fat cattle as years of plenty, lean ones as hard years to prepare for.",
    i:"In the tradition of Yusuf, cattle mark prosperous and lean years; healthy cows are good provision." },
  { k:"sheep", syn:["sheep","lamb","lambs","flock","goat","goats","shepherd"], animal:true, arch:"The Flock",
    sum:"Sheep are innocence, the gathered faithful, and gentle provision.",
    j:"Belonging, conformity, or the meek part of the self seeking guidance.",
    o:"The flock and the Good Shepherd; the lamb is innocence and sacrifice.",
    i:"Sheep often mean lawful wealth, followers, or a peaceable people in your care." },
  { k:"lion", syn:["lion","lions","tiger","tigers"], animal:true, arch:"The Mighty",
    sum:"The lion is raw power — courage, or a strong figure you must reckon with.",
    j:"Sovereign instinct and courage; the powerful, kingly drive within.",
    o:"Strength and danger; folk warns of a powerful adversary to face with faith.",
    i:"Ibn Sirin reads the lion as a mighty, often oppressive ruler or a powerful enemy." },
  { k:"stars", syn:["star","stars"], arch:"Destiny & Guidance",
    sum:"Stars are destiny and guidance — and, as in Joseph's dream, the people who orbit your life.",
    j:"Distant aims, hope, and the guiding pattern you steer by.",
    o:"Lights set by God for guidance; hope shining through the dark.",
    i:"In Yusuf's vision the stars are kin and notable people; bright stars can mean honor and leaders." },
  { k:"moon", syn:["moon","moonlight","crescent"], arch:"Cycles & Intuition",
    sum:"The moon is rhythm and intuition — the part of you that waxes, wanes, and senses in the dark.",
    j:"The reflective, intuitive, often feminine side and its natural cycles.",
    o:"A light for the night and a sign of changing seasons under providence.",
    i:"The moon can mean a notable person, a vizier, or beauty and standing, by its fullness." },
  { k:"bread", syn:["bread","food","eating","eat","meal","feast"], arch:"Provision",
    sum:"Bread and food are sustenance — what feeds your body, your bonds, and your spirit.",
    j:"Nourishment of the self; what you hunger for beyond the literal.",
    o:"Daily bread and providence; sharing food is communion and blessing.",
    i:"Bread is lawful provision and a settled life; abundant food is ease and blessing." },
  { k:"boat", syn:["boat","boats","ship","ships","sailing","sail","ferry","ark"], arch:"Passage",
    sum:"A boat carries you across deep water — how you navigate emotion and change.",
    j:"The vessel of the self crossing the unconscious; how you ride your feelings.",
    o:"Passage through trial; like the Ark, refuge carried safely through the flood.",
    i:"Salvation and escape from hardship; a sound vessel means deliverance and safe arrival." },
  { k:"bridge", syn:["bridge","bridges"], arch:"The Crossing",
    sum:"A bridge is a crossing — the span between one stage of life and the next.",
    j:"Transition and the link between two states of being.",
    o:"A passage over danger; trust in what carries you across.",
    i:"A way across difficulty; a sound bridge means a safe transition in your affairs." },
  { k:"trapped", syn:["trapped","cage","caged","prison","jail","stuck","can't move","cannot move","paralyzed","locked in"], arch:"Confinement",
    sum:"Being trapped is the feeling of a situation, role, or fear you can't move out of.",
    j:"A part of you held captive — by circumstance, habit, or your own defenses.",
    o:"A trial of patience; a call to seek the door that grace will open.",
    i:"Constraint or worry pressing on you; release in the dream foretells relief." },
  { k:"illness", syn:["sick","illness","ill","disease","hospital","wound","wounded","injured","fever"], arch:"The Wound",
    sum:"Illness in a dream is rarely about the body — it's a strain that wants tending.",
    j:"A part of the self that is hurting and asking for care and attention.",
    o:"A call to tend body and soul; sometimes a nudge toward repentance and rest.",
    i:"Often worry, a fault to mend, or hardship; recovery in the dream points to relief." },
  { k:"king", syn:["king","queen","crown","throne","royal","prince","princess"], arch:"Authority",
    sum:"A crown is authority and ambition — power held, sought, or answered to.",
    j:"The ruling principle of the psyche, or your relationship to your own authority.",
    o:"Earthly power under heaven's order; a reminder of who you ultimately serve.",
    i:"A king can mean a real authority over you, or honor and a rise in standing for the dreamer." },
];

// ── Additional cultural lenses ─────────────────────────────────────────
const CORE = { jungian:"j", orthodox:"o", islamic:"i" };
const EXTRA_TRADS = ["hindu","chinese","greek","buddhist","sumerian"];
const LENS = {
  hindu:    { label:"Hindu (Swapna Shastra)", lead:"Vedic dream lore weighs the omen and the hour — dreams near dawn carry the most meaning." },
  chinese:  { label:"Chinese (Zhougong)",     lead:"In the Duke of Zhou's tradition, the image is read as an omen for fortune, family, and standing." },
  greek:    { label:"Greek (Artemidorus)",    lead:"Artemidorus would read this against who you are and your station, often through likeness and wordplay." },
  buddhist: { label:"Buddhist",               lead:"The Buddhist view treats the dream as a passing formation of mind — to be observed with awareness, not grasped." },
  sumerian: { label:"Sumerian / Mesopotamian", lead:"The oldest dream tradition (Sumer, from c. 3100 BC) read a dream as an encounter — often a god bringing a message that a skilled interpreter, like the goddess Nanshe, had to unfold." },
};
// Per-symbol notes for the extra traditions (iconic symbols; others fall back to the lens)
const EXTRA = {
  snake:{ hindu:"In Swapna Shastra a snake is largely auspicious — it embodies kundalini, the coiled life-force; a bite often foretells healing, while a fearful snake marks an enemy.", chinese:"In Zhougong's lore a snake is an omen of wealth — a bite signals money coming, and a snake entering water points to a move or promotion.", greek:"Artemidorus read the serpent as time, royal power, or sickness, and often a hidden enemy; for the ill it could foretell recovery.", buddhist:"The mind's coiling — aversion or craving rising; watch it without grasping, knowing it is impermanent.", sumerian:"Serpents belonged to the powers below the earth and to Ningishzida, lord of the underworld's edge — a snake touched fate, healing, or the realm of the dead." },
  water:{ hindu:"Clear flowing water is prosperity and spiritual purification; muddy or stagnant water warns of trouble to cleanse.", chinese:"Calm clear water is fortune and wealth; turbulent or dirty water signals obstacles and worry.", greek:"Artemidorus tied the sea to one's master or livelihood — calm favors the voyage, rough waters warn of conflict.", buddhist:"The flow of feeling itself — watch how it moves, attaching to nothing, for it is all passing.", sumerian:"Rivers carried the gods' will and ran toward the netherworld; water in a dream could cleanse, judge, or bear a message to be read." },
  teeth:{ hindu:"Teeth falling is inauspicious in Vedic lore — a sign of possible loss or ill-health among relatives.", chinese:"Zhougong reads all the teeth falling out as a bad omen touching the family.", greek:"Artemidorus linked teeth to the household — losing them meant losing kin or property, upper teeth the greater members.", buddhist:"A reminder of decay and impermanence — body and supports are not fixed; meet the fear gently." },
  falling:{ hindu:"Falling can warn of a slip in fortune or pride; rising again is the soul reasserting its path.", chinese:"Falling from a height is a setback, or a warning to steady your position.", greek:"For Artemidorus, to fall from height was loss of office or standing — the higher the fall, the greater the loss.", buddhist:"Clinging to control is what makes falling fearful; loosening the grip is the practice it points to." },
  flying:{ hindu:"Flying freely is highly auspicious — a tendency toward liberation (moksha) and rising above worldly cares.", chinese:"Soaring is fortune and rising status; struggling to fly hints at obstacles in your climb.", greek:"Artemidorus held that to fly is good for almost everyone — freedom, success, rising above troubles.", buddhist:"Lightness and release — but even bliss is impermanent; enjoy it, then let it pass." },
  death:{ hindu:"Death usually means transformation and even longer life, not a literal end — a renewal.", chinese:"Dreaming someone is dying is read paradoxically — that person is wished long, healthy life.", greek:"Artemidorus often read death as a change of state — for the unmarried, even marriage; release into a new condition.", buddhist:"The clearest teacher of impermanence — not to be feared, but to wake you to how you live now.", sumerian:"Dreams of death and the underworld — as in Enkidu's — were grave omens the gods sent before the end of a matter." },
  dog:{ hindu:"A dog may be a loyal guardian or, if hostile, a base and troublesome person near you.", chinese:"A barking dog can warn of disputes or unwelcome news; a calm dog signals a faithful friend.", greek:"The Greeks set the dog at the threshold; a friendly one is a friend, a savage one an enemy.", buddhist:"Loyalty and instinct — notice whether you meet it with kindness or fear; both are mind-states." },
  baby:{ hindu:"A baby is a blessing and new karma beginning; birth dreams are studied closely for what they foretell.", chinese:"Birth dreams are major omens, often read to foretell a child's coming, gender, or fortune.", greek:"For Artemidorus a child could mean a new venture, or gain or burden depending on the dreamer.", buddhist:"A new formation arising in the mind — tend it with awareness, without clinging to what it must become." },
  fire:{ hindu:"A bright, contained fire (as in a homa or yajña) is purification and spiritual power; a wild blaze warns of loss.", chinese:"Bright, contained fire foretells prosperity; a destructive fire warns of conflict.", greek:"Moderate fire was good for Artemidorus — warmth and prosperity; a conflagration meant anger and danger.", buddhist:"The heat of passion or anger — watch it burn and cool, for it too passes." },
  house:{ hindu:"The house is the self and the family's fortune; a bright, strong house is stability and dharma kept.", chinese:"A well-kept house foretells household harmony; a damaged one warns of trouble at home.", greek:"Artemidorus read the house as the dreamer's life and body — its rooms and repairs mirror your affairs.", buddhist:"The dwelling of the self you build moment to moment — notice what you furnish it with." },
  money:{ hindu:"Gold can mean coming gain, yet Vedic lore warns easy wealth in dreams may invert in waking life.", chinese:"Finding wealth is generally a good omen; losing it warns of waste or worry.", greek:"Artemidorus tied gold to worth and worry alike — what you prize, and what you fear to lose.", buddhist:"Attachment to gain — the dream invites you to notice the grasping, not the gold." },
  departed:{ hindu:"A departed one serene, smiling, or giving gifts is ancestral blessing (pitru prasāda) — the lineage at peace and watching over you.", chinese:"Ancestors are honored as guidance; a peaceful visit invites remembrance and offerings, a troubled one a duty unmet.", greek:"The Greeks held the dead could truly visit in dreams; their words were weighed as counsel or warning.", buddhist:"The bond continues as memory and mind; meet them with loving-kindness, then release — clinging holds you both.", sumerian:"The dead were real visitors from the netherworld (Kur); their words were heeded, and offerings (kispu) were made to keep them at peace." },
  cat:{ greek:"Artemidorus associated the cat with an adulterer or a thief — a sly presence.", chinese:"A cat can foretell petty theft or a cunning person near you.", hindu:"A cat may mark deceit or a quarrel approaching." },
  bird:{ hindu:"Birds carry the soul and messages; auspicious birds bring good news and grace.", chinese:"Auspicious birds (the phoenix, magpie) foretell joy; crows warn of the opposite.", greek:"Artemidorus read birds by kind — eagles for power and patrons, doves for women and peace.", buddhist:"Thoughts taking flight — observe them rise and pass without chasing.", sumerian:"Nanshe, the dream-goddess, was goddess of birds and fish; a bird could carry her message across the marsh of sleep." },
  fish:{ hindu:"Fish are fortune and fertility — provision, and sometimes a coming child.", chinese:"Fish (yú) sounds like 'surplus' — a classic omen of abundance.", greek:"Artemidorus read fish by depth and catch — gains drawn up by effort, or slippery hopes.", buddhist:"Insights surfacing from the deep mind — receive them lightly.", sumerian:"Nanshe's own creatures were fish; a fish could signal her favor and provision drawn from the waters." },
  mountain:{ hindu:"A mountain is the sacred ascent (Meru, Kailasa) — effort toward the divine and a high aim.", chinese:"Climbing a mountain foretells rising status reached through effort.", greek:"For Artemidorus, high ground meant high office, or a hard climb toward it.", buddhist:"The path itself — steady effort, one step, without grasping the summit." },
  light:{ hindu:"Light and the sun are Surya's grace — clarity, vitality, and dharma illuminated.", chinese:"A rising sun foretells family prosperity and success; a darkened one warns of decline.", greek:"Artemidorus read the sun as the dreamer's life-force and the great patron above.", buddhist:"Awareness itself dawning — the clear seeing the practice aims at.", sumerian:"Shamash, sun-god of truth and justice, oversaw oracles; sunlight marked a true message and judgment set right." },
  moon:{ chinese:"A bright full moon foretells reunion and prosperity; a darkened moon warns of separation.", hindu:"The moon (Chandra) governs mind and emotion — a bright moon soothes, a waning one unsettles.", greek:"Artemidorus tied the moon to women, travel, and changing fortunes.", buddhist:"The mind reflecting like the moon on water — calm it, and the image clears." },
  stars:{ hindu:"Stars and planets (grahas) mark destiny; bright stars favor the path, falling ones warn.", chinese:"Bright stars and clear skies are good omens; stars falling or dimmed are unlucky.", greek:"Artemidorus read the stars as the great and the distant — patrons, fates, and far hopes.", buddhist:"Countless and far — a reminder of how small the grasping self is against the whole." },
  naked:{ hindu:"Nakedness can mean lost standing or, in a pure context, the shedding of ego and pretense.", chinese:"Being naked in public warns of exposure, gossip, or a secret coming to light.", greek:"Artemidorus read nakedness by context — shameful exposure, or for the honest, freedom and truth.", buddhist:"The self stripped of its costumes — see what remains when pretense falls." },
  chase:{ greek:"Artemidorus read pursuit as a real threat or rivalry pressing on the dreamer.", chinese:"Being chased warns of trouble or a rival; escaping foretells overcoming it.", hindu:"Pursuit marks an enemy or a fear; outrunning it is a good sign of release.", buddhist:"What you flee in the dream is what you flee in the mind — turning to face it is the practice." },
  worm:{ hindu:"In Vedic terms the worm sits at the base of the karmic cycle; dreaming of it suggests a purification — old karma breaking down to make room for something higher." },
};

const PRACTICES = [
  "before sleep, write one sentence naming what you're avoiding — naming loosens its grip.",
  "take five slow breaths and ask the dream image one question, then notice the first answer that comes.",
  "name one thing you can let go of this week, and one thing you want to protect.",
  "tell the dream to someone you trust, out loud — speaking it changes how it sits in you.",
  "sit two minutes with the feeling the dream left, without explaining or fixing it.",
];
const TENSIONS = [
  "a pull between holding on and letting go",
  "something you know but haven't let yourself say",
  "a boundary that wants either defending or opening",
  "an old self loosening to make room for a new one",
  "care and fear pointing at the same person or choice",
];
const QUESTIONS = [
  "What feeling did the dream leave you with when you woke?",
  "Who, in waking life, does the strongest figure in the dream remind you of?",
  "If the dream were advice, what would it be asking of you?",
  "What part of this are you already half-aware of?",
];

const SEED = [
  {s:"water",n:4120},{s:"flying",n:3380},{s:"falling",n:2910},{s:"home",n:2640},
  {s:"dog",n:2540},{s:"teeth",n:2210},{s:"chase",n:1980},{s:"fire",n:1870},
  {s:"death",n:1760},{s:"baby",n:1620},{s:"road",n:1540},{s:"departed",n:1480},
  {s:"forest",n:1390},{s:"money",n:1330},{s:"hair",n:1240},{s:"naked",n:1180},
  {s:"snake",n:1090},{s:"storm",n:1010},{s:"crying",n:920},{s:"light",n:870},
];

const SUF = ["","s","es","ing","ed"];
function synHit(raw, tokens, s){
  if(s.includes(" ")) return raw.includes(s);
  return tokens.some(tok => SUF.some(suf => tok === s+suf));
}

const FAMILY = ["mother","mom","mum","mama","father","dad","papa","grandmother","grandma","grandpa","grandfather","granny","brother","sister","uncle","aunt","cousin","son","daughter","wife","husband"];
const DEADWORDS = ["dead","died","deceased","passed","late","grave","heaven","funeral"];
const DEAD_PHRASES = ["passed away","deceased","my late","who died","no longer with us","who passed","late grand"];
const DECEASED = { k:"departed", arch:"The Departed",
  sum:"A loved one who has passed appearing in your dream is one of the tenderest images there is — often less an omen than a meeting.",
  j:"Jung saw the dead as living parts of the psyche; the bond continues inwardly, and the dream may carry their wisdom, or words left unsaid between you.",
  o:"In Orthodox and folk tradition, a departed one at peace means their soul rests; if they ask for something, it is read as a call to pray for them, light a candle, or give alms in their memory.",
  i:"Classical Islam holds that the dead speak truthfully in dreams: appearing serene or in bright garments is glad tidings, while a request is taken as a wish for du'a or sadaqah on their behalf." };

function interpretLocal(text, tradition){
  const raw = text.toLowerCase();
  const tokens = raw.split(/[^a-z]+/).filter(Boolean);
  const matched = DICT
    .map(e => ({ e, pos: Math.min(...e.syn.map(s => { const p = raw.indexOf(s); return p === -1 ? 1e9 : p; })) }))
    .filter(x => e2hit(x.e, raw, tokens))
    .sort((a,b) => a.pos - b.pos)
    .map(x => x.e)
    .slice(0,4);

  const biteFlag = tokens.some(t => ["bite","bites","bit","bitten","biting","attack","attacks","attacked","attacking"].includes(t));

  const seesDeceased = DEAD_PHRASES.some(p => raw.includes(p)) ||
    (tokens.some(t => FAMILY.includes(t)) && tokens.some(t => DEADWORDS.includes(t)));
  let M = seesDeceased ? [DECEASED, ...matched.filter(m => m.k !== "death")].slice(0,4) : matched;

  if(M.length === 0){
    const base = "No single classic symbol surfaced — which usually means the feeling carried more than the images did.";
    const readings = tradition === "all"
      ? [
          {tradition:"Jungian", text:"Let the emotional tone lead: the mood you woke in is the real message, more than any object in the dream."},
          {tradition:"Orthodox & folk", text:"Hold it lightly; folk wisdom says an unclear dream asks for patience, not decoding."},
          {tradition:"Islamic (Ta'bir)", text:"A vague dream is often from the self, not a sign — note it, but don't weigh it heavily."},
        ]
      : [{ tradition: tradName(tradition), text: base + " Add a detail — an animal, water, a person, a place — and the reading sharpens." }];
    return { archetype:"Open Dream", summary: base, symbols:[], readings, question: QUESTIONS[tokens.length % QUESTIONS.length], _syms:[] };
  }

  const dom = M[0];
  let summary = dom.sum;
  summary += " The details matter as much as the symbol: its mood, whether it felt calm or frightening, and the feeling you woke with all shift the meaning.";
  if(M.length >= 2){
    summary += ` Your dream brings ${M[0].k} and ${M[1].k} together, so read them as one woven message rather than two separate omens.`;
  }
  if(biteFlag && M.some(m => m.animal)){
    summary += " The bite turns it into a moment of confrontation — open hostility, or a betrayal worth heeding.";
  }
  const has = (arr) => arr.some(w => tokens.includes(w));
  if(has(["teeth","tooth"]) && has(["fall","falling","fell","falls","loose","crumbling","crumble","out"])){
    summary += " Teeth actually falling out is the sharpest form — usually anxiety over change, loss, or words you fear you can't take back.";
  }
  if(has(["money","gold","coins","cash"]) && has(["found","find","finding","picked","pick"])){
    summary += " Finding money is the classic folk reversal — read more as a warning of loss or worry than as real gain.";
  }
  if(has(["baby","babies","infant","newborn"]) && has(["crying","cry","cries","screaming","wailing"])){
    summary += " A crying baby points to a need in you — or a new venture — that isn't being heard or tended.";
  }
  if(M.some(m => m.animal)){
    const COLORS = { black:"black deepens the warning — a hidden or shadow side asking to be seen", white:"white leans pure, honest, or peaceful", red:"red flags strong passion, anger, or danger", brown:"brown reads steadier, dependable, more trustworthy", green:"green hints at growth, envy, or healing", golden:"gold lends value or something prized", grey:"grey suggests something unclear or in-between", gray:"grey suggests something unclear or in-between" };
    const col = Object.keys(COLORS).find(c => tokens.includes(c));
    if(col) summary += ` The ${col === "gray" ? "grey" : col} colour shades it — ${COLORS[col]}.`;
  }

  let readings;
  if(tradition === "all"){
    readings = [
      {tradition:"Jungian", text: readingFor("jungian",M)},
      {tradition:"Orthodox & folk", text: readingFor("orthodox",M)},
      {tradition:"Islamic (Ta'bir)", text: readingFor("islamic",M)},
    ];
    EXTRA_TRADS.forEach(t => {
      const hasSpecific = M.slice(0,3).some(m => EXTRA[m.k] && EXTRA[m.k][t]);
      if(hasSpecific) readings.push({ tradition: LENS[t].label, text: readingFor(t,M) });
    });
  } else {
    readings = [{ tradition: tradName(tradition), text: readingFor(tradition, M) }];
  }

  return {
    archetype: dom.arch,
    summary,
    symbols: M.map(m => ({ symbol: m.k, meaning: m.j })),
    readings,
    question: QUESTIONS[(dom.k.length + M.length) % QUESTIONS.length],
    _syms: M.map(m => m.k),
    _matched: M,
  };
}
function e2hit(e, raw, tokens){ return e.syn.some(s => synHit(raw, tokens, s)); }
function tradName(t){ return ({all:"All",jungian:"Jungian",orthodox:"Orthodox & folk",islamic:"Islamic (Ta'bir)"}[t]) || (LENS[t] && LENS[t].label) || t; }

const OPENER = {
  jungian:  a => `Seen through a Jungian lens, the dream gathers around ${a}.`,
  orthodox: a => `In the Orthodox and folk reading, it points to ${a}.`,
  islamic:  a => `Read in the tradition of Ta'bir, it speaks of ${a}.`,
  hindu:    a => `In Vedic dream lore, the omen turns on ${a}.`,
  chinese:  a => `In the Duke of Zhou's tradition, the sign here is ${a}.`,
  greek:    a => `As Artemidorus would read it, the dream concerns ${a}.`,
  buddhist: a => `Through a Buddhist lens, this is ${a} arising in the mind.`,
  sumerian: a => `In the oldest, Mesopotamian reading, it is an encounter touching ${a}.`,
};
const CLOSERS = [
  "How it appeared — its mood, and the feeling it left when you woke — shades all of this; trust that feeling first.",
  "Read it as a mirror of what you're carrying now, not as a prediction of what's to come.",
  "Sit with the strongest image for a moment; it usually points at something already stirring in you.",
  "What it asks for is gentle attention, not alarm — let the meaning settle rather than forcing it.",
];

function readingFor(t, M){
  const a = (M[0].arch || "this").toLowerCase();
  const open = OPENER[t] ? OPENER[t](a) : "";
  let notes;
  if(CORE[t]) notes = M.slice(0,3).map(m => m[CORE[t]]);
  else notes = M.slice(0,3).map(m => EXTRA[m.k] && EXTRA[m.k][t]).filter(Boolean);

  let bodyText;
  if(!notes.length) bodyText = M[0].sum;                 // extra tradition w/ no specific note: universal meaning
  else if(notes.length === 1) bodyText = notes[0];
  else {
    const names = M.slice(0, notes.length).map(m => m.k);
    const combo = ` Where ${names.slice(0,-1).join(", ")} meets ${names[names.length-1]}, the dream weaves them into one message rather than several.`;
    bodyText = notes.join(" ") + combo;
  }
  const closer = CLOSERS[(a.length + M.length) % CLOSERS.length];
  return [open, bodyText, closer].filter(Boolean).join(" ");
}

function deepLocal(result){
  if(!result || !result._matched || !result._matched.length){
    return "Sit with the feeling this dream left you, even without clear symbols. Tonight, " + PRACTICES[0];
  }
  const m = result._matched;
  const idx = (result.archetype.length + m.length);
  const tension = TENSIONS[idx % TENSIONS.length];
  const practice = PRACTICES[idx % PRACTICES.length];
  const parts = [
    `Across traditions, your dream gathers around ${result.archetype.toLowerCase()}.`,
    m[0].j,
    m[0].o,
    m[0].i,
  ];
  if(m[1]) parts.push(`The presence of ${m[1].k} adds another layer — ${m[1].j.toLowerCase()}`);
  parts.push(`The thread tying these together looks like ${tension}.`);
  parts.push(`For today: ${practice}`);
  return parts.join(" ");
}

// ── Lexicon: the full, browsable list of every symbol ──────────────────
const LEXICON = [...DICT, DECEASED].sort((a,b) => a.k.localeCompare(b.k));
function symbolReadings(entry){
  const M = [entry];
  const out = [
    { tradition:"Jungian", text: readingFor("jungian", M) },
    { tradition:"Orthodox & folk", text: readingFor("orthodox", M) },
    { tradition:"Islamic (Ta'bir)", text: readingFor("islamic", M) },
  ];
  EXTRA_TRADS.forEach(t => { if(EXTRA[entry.k] && EXTRA[entry.k][t]) out.push({ tradition: LENS[t].label, text: readingFor(t, M) }); });
  return out;
}

// ── Persistent dream journal (survives across sessions) ────────────────
const JKEY = "findmydream:journal:v1";
function fmtDate(ts){ return new Date(ts).toLocaleDateString("en-GB",{ day:"numeric", month:"short", year:"numeric" }); }
async function loadJournal(){
  try { if(typeof window==="undefined" || !window.storage) return null; const r = await window.storage.get(JKEY); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
}
async function persistJournal(arr){
  try { if(typeof window!=="undefined" && window.storage) await window.storage.set(JKEY, JSON.stringify(arr.slice(0,500))); }
  catch(e){ console.error("journal save failed", e); }
}
function sampleSeed(){
  const now = Date.now(), DAY = 86400000;
  return [
    { id:"s1", ts: now - 365*DAY + 1*DAY, dream:"I was walking by a wide river at dawn and a brown dog ran beside me the whole way.", archetype:"The Companion & the Shadow", tradition:"all", symbols:["dog","water"] },
    { id:"s2", ts: now - 365*DAY - 2*DAY, dream:"My late grandfather sat at the kitchen table, calm, and smiled at me without a word.", archetype:"The Departed", tradition:"orthodox", symbols:["departed"] },
    { id:"s3", ts: now - 205*DAY, dream:"I kept climbing stairs that never ended, but I wasn't tired at all.", archetype:"Rising & Falling", tradition:"all", symbols:["stairs"] },
  ];
}
function onThisDay(journal){
  const now = new Date();
  const md = (d)=>{ const x = new Date(d); return x.getMonth()*31 + x.getDate(); };
  const today = md(now);
  return journal.filter(e => new Date(e.ts).getFullYear() < now.getFullYear() && Math.abs(md(e.ts) - today) <= 5);
}

export default function FindMyDream(){
  const [dream,setDream] = useState("");
  const [tradition,setTradition] = useState("all");
  const [loading,setLoading] = useState(false);
  const [deepLoading,setDeepLoading] = useState(false);
  const [result,setResult] = useState(null);
  const [deep,setDeep] = useState("");
  const [journal,setJournal] = useState([]);
  const [collective,setCollective] = useState(SEED);
  const [lex,setLex] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let arr = await loadJournal();
      if(arr === null) return;            // storage unavailable: stay in-memory
      if(arr.length === 0){ arr = sampleSeed(); await persistJournal(arr); }
      if(alive) setJournal(arr);
    })();
    return () => { alive = false; };
  }, []);

  function interpret(){
    if(!dream.trim() || loading) return;
    setLoading(true); setResult(null); setDeep("");
    setTimeout(() => {
      const data = interpretLocal(dream.trim(), tradition);
      setResult(data);
      const entry = { id: String(Date.now()), ts: Date.now(), dream: dream.trim(), archetype: data.archetype, tradition, symbols: data._syms || [] };
      setJournal(j => { const next = [entry, ...j]; persistJournal(next); return next; });
      if(data._syms && data._syms.length){
        setCollective(prev => {
          const map = new Map(prev.map(p => [p.s, p.n]));
          data._syms.forEach(s => map.set(s, (map.get(s) || 0) + 1));
          return Array.from(map, ([s,n]) => ({s,n})).sort((a,b) => b.n - a.n).slice(0,20);
        });
      }
      setLoading(false);
    }, 420);
  }

  function deepReading(){
    if(deepLoading || !result) return;
    setDeepLoading(true);
    setTimeout(() => { setDeep(deepLocal(result)); setDeepLoading(false); }, 500);
  }

  const maxN = useMemo(() => Math.max(...collective.map(c => c.n)), [collective]);
  const top = collective[0];

  return (
    <div className="vv-tablet" style={{ background:C.midnight, color:C.moon, minHeight:"100vh", fontFamily:"'EB Garamond', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');
        @keyframes pulseGlow { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fadeUp{ animation: fadeUp .5s ease both }
        .vv-node{ animation: pulseGlow 4.5s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce){ .vv-node,.fadeUp{ animation:none !important } }
        .vv-ta::placeholder{ color:${C.muted} }
        .vv-ta:focus{ outline:2px solid ${C.ember}; outline-offset:2px }
        button:focus-visible{ outline:2px solid ${C.gold}; outline-offset:2px }
        .vv-tablet{
          background-color:${C.midnight};
          background-image:
            radial-gradient(120% 80% at 50% -10%, rgba(227,178,60,0.10), rgba(23,17,11,0) 60%),
            repeating-linear-gradient(115deg, rgba(255,240,210,0.020) 0px, rgba(255,240,210,0.020) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 7px),
            repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 9px);
        }
        .carve{ color:${C.gold}; text-shadow: 0 1px 0 rgba(255,225,170,0.18), 0 -1px 1px rgba(0,0,0,0.55), 0 2px 3px rgba(0,0,0,0.45); }
        .wedge{ display:inline-flex; gap:5px; align-items:center; }
        .wedge i{ width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:9px solid ${C.ember}; opacity:.8; display:block; }
        .wedge i:nth-child(2){ border-top-color:${C.gold}; transform:scaleY(.7) }
        .wedge i:nth-child(3){ opacity:.5 }
      `}</style>

      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", top:-120, left:"50%", transform:"translateX(-50%)", width:520, height:320, borderRadius:"50%", pointerEvents:"none", background:"radial-gradient(circle, rgba(227,178,60,0.18) 0%, rgba(23,17,11,0) 70%)" }} />

        <div className="max-w-2xl mx-auto px-5 pb-20" style={{ position:"relative" }}>
          <header className="flex items-center justify-between pt-7 pb-6">
            <div className="flex items-center gap-3">
              <span className="wedge" aria-hidden="true"><i></i><i></i><i></i></span>
              <div>
                <span className="carve" style={{ fontFamily:"'EB Garamond', Georgia, serif", fontWeight:700, letterSpacing:"0.01em", fontSize:24 }}><span style={{ color:C.moon }}>FindMy</span><span style={{ color:C.gold }}>Dream</span></span>
                <div style={{ fontFamily:"Space Mono, monospace", fontSize:9.5, color:C.muted, letterSpacing:"0.22em", marginTop:2 }}>DREAM ORACLE</div>
              </div>
            </div>
            <Flame size={20} color={C.ember} />
          </header>

          <h1 className="carve mb-2" style={{ fontFamily:"Cinzel, serif", fontWeight:600, fontSize:31, lineHeight:1.12, color:C.moon }}>What did you<br />dream last night?</h1>
          <p style={{ color:C.muted }} className="text-sm mb-5 leading-relaxed">Write it down. We read it across several traditions — and it joins the dreams of real, verified people.</p>

          <div style={{ background:C.panel, border:`1px solid ${C.line}`, borderRadius:18 }} className="p-4">
            <textarea className="vv-ta w-full resize-none bg-transparent text-base leading-relaxed" style={{ color:C.moon, minHeight:104, border:"none" }}
              placeholder="A brown dog bit me on the elbow while I was crossing a river..." value={dream} onChange={(e)=>setDream(e.target.value)} />
            <div className="flex flex-wrap gap-2 mt-3 mb-4">
              {TRADITIONS.map(t => {
                const on = tradition === t.id;
                return (
                  <button key={t.id} onClick={()=>setTradition(t.id)} className="text-xs px-3 py-1.5 rounded-full transition"
                    style={{ background:on?C.ember:"transparent", color:on?C.midnight:C.muted, border:`1px solid ${on?C.ember:C.line}`, fontWeight:600 }}>{t.label}</button>
                );
              })}
            </div>
            <button onClick={interpret} disabled={loading || !dream.trim()} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 transition"
              style={{ background:dream.trim()?C.ember:C.panel2, color:dream.trim()?C.midnight:C.muted, fontWeight:700, cursor:dream.trim()?"pointer":"default" }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
              {loading ? "Reading your dream..." : "Interpret dream"}
            </button>
          </div>

          {result && (
            <div className="fadeUp mt-7">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} color={C.gold} />
                <span style={{ fontFamily:"Space Mono, monospace", fontSize:11, letterSpacing:"0.16em", color:C.muted }}>DOMINANT ARCHETYPE</span>
              </div>
              <div className="carve mb-2" style={{ fontFamily:"Cinzel, serif", fontWeight:600, fontSize:26 }}>{result.archetype}</div>
              <p className="text-sm leading-relaxed mb-4" style={{ color:C.moon }}>{result.summary}</p>

              {result.symbols.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {result.symbols.map((s,i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full capitalize" style={{ background:C.panel2, color:C.gold, border:`1px solid ${C.line}` }} title={s.meaning}>{s.symbol}</span>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {result.readings.map((it,i) => (
                  <div key={i} style={{ background:C.panel, border:`1px solid ${C.line}`, borderRadius:14 }} className="p-4">
                    <div style={{ color:C.ember, fontWeight:700 }} className="text-sm mb-1.5">{it.tradition}</div>
                    <p className="text-sm leading-relaxed" style={{ color:C.moon }}>{it.text}</p>
                  </div>
                ))}
              </div>

              {result.question && <p className="text-sm italic mt-4" style={{ color:C.muted }}>"{result.question}"</p>}

              <div className="mt-5" style={{ background:C.panel2, border:`1px dashed ${C.ember}`, borderRadius:14 }}>
                {!deep ? (
                  <button onClick={deepReading} disabled={deepLoading} className="w-full flex items-center justify-center gap-2 py-3.5">
                    {deepLoading ? <Loader2 size={16} className="animate-spin" color={C.ember} /> : <Lock size={15} color={C.ember} />}
                    <span style={{ color:C.ember, fontWeight:700 }} className="text-sm">{deepLoading ? "Weaving the deep reading..." : "Deep reading — 1 π"}</span>
                  </button>
                ) : (
                  <div className="p-4">
                    <div style={{ color:C.gold, fontWeight:700 }} className="text-sm mb-1.5">Deep reading</div>
                    <p className="text-sm leading-relaxed" style={{ color:C.moon }}>{deep}</p>
                  </div>
                )}
              </div>
              <p className="text-xs mt-2" style={{ color:C.muted }}>On Pi, the deep reading is paid in Pi — a micro-amount, perfect for a daily habit.</p>
            </div>
          )}

          <section className="mt-10">
            <div className="flex items-center gap-2 mb-1">
              <Moon size={16} color={C.gold} />
              <span style={{ fontFamily:"Space Mono, monospace", fontSize:11, letterSpacing:"0.16em", color:C.muted }}>THE COLLECTIVE UNCONSCIOUS</span>
            </div>
            <p className="text-sm mb-4" style={{ color:C.moon }}>
              <span style={{ color:C.gold, fontWeight:700, fontFamily:"Space Mono, monospace" }}>{top ? top.n.toLocaleString("en-US") : 0}</span>{" "}
              verified people dreamed of <span style={{ color:C.gold, fontWeight:600 }} className="capitalize">{top ? top.s : "—"}</span> this week.
            </p>
            <div style={{ background:C.panel, border:`1px solid ${C.line}`, borderRadius:18 }} className="p-5">
              <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                {collective.map((c,i) => {
                  const size = 24 + Math.round((c.n / maxN) * 30);
                  const isTop = i === 0;
                  return (
                    <div key={c.s} className="flex flex-col items-center justify-end">
                      <div className="vv-node rounded-full" style={{ width:size, height:size, background:isTop?C.ember:"rgba(227,178,60,0.16)", boxShadow:isTop?`0 0 20px ${C.ember}`:`0 0 12px rgba(227,178,60,0.22)`, border:isTop?"none":`1px solid rgba(227,178,60,0.4)`, animationDelay:`${(i%6)*0.5}s` }} />
                      <span className="capitalize mt-2 text-center" style={{ fontSize:11, color:C.moon, fontWeight:600, lineHeight:1.1 }}>{c.s}</span>
                      <span style={{ fontFamily:"Space Mono, monospace", fontSize:9, color:C.muted }}>{c.n.toLocaleString("en-US")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs mt-2 leading-relaxed" style={{ color:C.muted }}>Simulated demo data. In the real version, every node = people verified through Pi — impossible to fake with bots. That's why this only works on Pi.</p>
          </section>

          <section className="mt-10">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={16} color={C.gold} />
              <span style={{ fontFamily:"Space Mono, monospace", fontSize:11, letterSpacing:"0.16em", color:C.muted }}>DREAM LEXICON · {LEXICON.length}</span>
            </div>
            <p className="text-sm mb-4" style={{ color:C.muted }}>Every symbol FindMyDream can read. Tap one to see it across all traditions.</p>
            <div className="flex flex-wrap gap-2">
              {LEXICON.map(e => {
                const on = lex && lex.k === e.k;
                return (
                  <button key={e.k} onClick={() => setLex(on ? null : e)} className="text-xs px-2.5 py-1 rounded-full capitalize transition"
                    style={{ background:on?C.gold:C.panel, color:on?C.midnight:C.moon, border:`1px solid ${on?C.gold:C.line}`, fontWeight:600 }}>{e.k}</button>
                );
              })}
            </div>
            {lex && (
              <div className="fadeUp mt-4" style={{ background:C.panel, border:`1px solid ${C.line}`, borderRadius:16 }}>
                <div className="p-4">
                  <div className="carve mb-1" style={{ fontFamily:"Cinzel, serif", fontWeight:600, fontSize:22 }}>{lex.arch}</div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color:C.moon }}>{lex.sum}</p>
                  <div className="space-y-2.5">
                    {symbolReadings(lex).map((it,i) => (
                      <div key={i}>
                        <div style={{ color:C.ember, fontWeight:700 }} className="text-xs mb-0.5">{it.tradition}</div>
                        <p className="text-sm leading-relaxed" style={{ color:C.moon }}>{it.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {journal.length > 0 && (() => {
            const back = onThisDay(journal);
            return (
            <section className="mt-9">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} color={C.muted} />
                <span style={{ fontFamily:"Space Mono, monospace", fontSize:11, letterSpacing:"0.16em", color:C.muted }}>YOUR DREAM JOURNAL · {journal.length}</span>
              </div>

              {back.length > 0 ? (
                <div className="mb-5" style={{ background:C.panel2, border:`1px solid ${C.ember}`, borderRadius:14 }}>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <Sparkles size={14} color={C.gold} />
                    <span style={{ color:C.gold, fontWeight:700 }} className="text-sm">On this day, a year ago</span>
                  </div>
                  <div className="px-4 pb-3">
                    {back.map((e,i) => (
                      <div key={e.id} className="py-2" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                        <div style={{ fontFamily:"Space Mono, monospace", fontSize:10, color:C.muted }}>{fmtDate(e.ts)}</div>
                        <div style={{ color:C.gold, fontWeight:600 }} className="text-xs mt-0.5">{e.archetype}</div>
                        <div className="text-sm" style={{ color:C.moon }}>{e.dream.length > 120 ? e.dream.slice(0,120)+"…" : e.dream}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-5 p-4 text-xs leading-relaxed" style={{ background:C.panel, border:`1px dashed ${C.line}`, borderRadius:14, color:C.muted }}>
                  Keep journaling, and this is where last year's dreams from around today will surface — so you can see what your mind was circling this time last year.
                </div>
              )}

              <div className="space-y-2">
                {journal.map((j,i) => (
                  <div key={j.id || i} className="py-2" style={{ borderBottom:`1px solid ${C.line}` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily:"Space Mono, monospace", fontSize:10, color:C.muted }} className="whitespace-nowrap">{fmtDate(j.ts || j.when)}</span>
                      <span style={{ color:C.gold, fontWeight:600 }} className="text-xs">{j.archetype}</span>
                    </div>
                    <div className="text-sm mt-0.5" style={{ color:C.moon }}>{j.dream.length > 90 ? j.dream.slice(0,90)+"…" : j.dream}</div>
                  </div>
                ))}
              </div>
            </section>
            );
          })()}

          <footer className="mt-12 pt-5 text-xs leading-relaxed" style={{ borderTop:`1px solid ${C.line}`, color:C.muted }}>
            FindMyDream — prototype v1. Your dreams are saved on this device and persist between sessions, so you can look back over months and years. On Pi, they would be stored privately per verified user, and the AI deep reading would run server-side. For reflection, not medical or psychological advice.
          </footer>
        </div>
      </div>
    </div>
  );
}
