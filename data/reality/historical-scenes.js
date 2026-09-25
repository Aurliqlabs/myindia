/* Verified public events through 25 September 2026. Player responses are fictional. */
const REAL_SCENES = Object.freeze([
  {
    id:'government-2024',date:'2024-06-09',region:'New Delhi',title:'A new Union government takes oath',
    fact:'Narendra Modi and the Council of Ministers were sworn in at Rashtrapati Bhavan on 9 June 2024.',
    scene:'The oath is already history when your story begins. Institutions, incumbents and opposition parties have established positions; a new movement enters this political landscape with no seats.',
    source:'Prime Minister’s Office',url:'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2023782',archive:true
  },
  {
    id:'assembly-kerala-2026',date:'2026-05-05',region:'Kerala',title:'A changed assembly map',
    fact:'The Election Commission reported 140 Kerala assembly results: INC won 63 seats, CPI(M) 26 and IUML 22.',
    scene:'In your home-state networks, organisers argue over the result. One wants to borrow a party’s machinery; another insists a new movement must earn trust from the ground up.',
    source:'Election Commission of India',url:'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S11.htm',
    archive:true
  },
  {
    id:'assembly-bengal-2026',date:'2026-05-05',region:'West Bengal',title:'A decisive count in Bengal',
    fact:'At its 5 May update, the Election Commission showed BJP on 207 seats and AITC on 80, with 293 of 294 constituencies accounted for.',
    scene:'A television map changes colour while the count is still being finalised. Your team sees how quickly a state-wide contest can rewrite the national conversation.',
    source:'Election Commission of India',url:'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm',
    archive:true
  },
  {
    id:'assembly-assam-2026',date:'2026-05-05',region:'Assam',title:'Assam returns its assembly result',
    fact:'The Election Commission recorded BJP winning 82 of 126 Assam assembly seats, with INC winning 19.',
    scene:'Far from your Delhi gathering, another election has already shaped the political balance. Your scattered contacts in the Northeast are a reminder that national slogans travel through very local contests.',
    source:'Election Commission of India',url:'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S03.htm',archive:true
  },
  {
    id:'assembly-tamil-nadu-2026',date:'2026-05-05',region:'Tamil Nadu',title:'A new force leads the Tamil Nadu count',
    fact:'The Election Commission recorded TVK winning 108 of 234 Tamil Nadu assembly seats, DMK 59 and ADMK 47.',
    scene:'A new party’s result reaches your small volunteer group. It suggests that an outsider can change a contest; it says nothing about whether your movement has built the same local roots.',
    source:'Election Commission of India',url:'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm',archive:true
  },
  {
    id:'assembly-puducherry-2026',date:'2026-05-05',region:'Puducherry',title:'Puducherry’s 30-seat verdict',
    fact:'The Election Commission recorded AINRC winning 12 of 30 Puducherry assembly seats, with DMK on 5 and BJP on 4.',
    scene:'The small assembly has its own alliances and arithmetic. Your team learns that a national strategy cannot simply be copied from one state to another.',
    source:'Election Commission of India',url:'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-U07.htm',archive:true
  },
  {
    id:'neet-reexam-2026',date:'2026-06-21',region:'National',title:'The medical entrance examination is held again',
    fact:'The National Testing Agency held the NEET (UG) 2026 re-examination on 21 June, following the examination held on 3 May.',
    scene:'A student volunteer asks for help making sense of the official notices. Everyone in the room has an opinion. You need to decide whether your movement has the capacity to offer reliable assistance.',
    source:'National Testing Agency',url:'https://neet.nta.nic.in/',
    choices:[
      {label:'Run a student help desk',detail:'Offer verified application and refund guidance.',effect:{funds:-8000,credibility:3,volunteers:12,energy:-6}},
      {label:'Ask for public documentation',detail:'Publish a measured request for clarity on examination administration.',effect:{credibility:2,media:2,energy:-4}},
      {label:'Stay focused on the movement',detail:'Preserve resources while others respond.',effect:{energy:3,support:-1}}
    ]
  },
  {
    id:'monsoon-opens-2026',date:'2026-07-20',region:'New Delhi',title:'Parliament opens its Monsoon Session',
    fact:'The 2026 Monsoon Session of Parliament began on 20 July and was scheduled for 19 sittings through 13 August.',
    scene:'The House opens while your organisation is still learning to document a complaint properly. A senior volunteer puts a blank policy brief on your desk.',
    source:'Ministry of Parliamentary Affairs',url:'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2298901&lang=1&reg=3',
    choices:[
      {label:'Send a documented policy brief',detail:'Spend time translating field complaints into specific proposals.',effect:{funds:-6000,credibility:3,recognition:1,energy:-7}},
      {label:'Hold a public town hall',detail:'Build support around what citizens want their MPs to raise.',effect:{funds:-12000,support:2,volunteers:16,media:1,energy:-8}},
      {label:'Observe the proceedings',detail:'Study the session before taking a public position.',effect:{energy:2,credibility:1}}
    ]
  },
  {
    id:'exam-bill-2026',date:'2026-07-27',region:'New Delhi',title:'A new public examinations Bill is introduced',
    fact:'The Public Examinations (Prevention of Unfair Means) Amendment Bill, 2026 was introduced in Lok Sabha. Introduction did not itself make the proposal law.',
    scene:'A headline calls the proposal a new law. Your research lead points to the words “as introduced” on the parliamentary document and asks you to be precise before speaking.',
    source:'Parliament of India',url:'https://sansad.in/getFile/BillsTexts/LSBillTexts/Asintroduced/AS%20INTRO7272026121928PM.pdf?source=legislation',
    choices:[
      {label:'Read and annotate the Bill',detail:'Show students exactly what is proposed and what remains undecided.',effect:{funds:-4000,credibility:4,energy:-6}},
      {label:'Hold a student listening session',detail:'Gather concerns before taking a position.',effect:{funds:-7000,support:2,volunteers:8,energy:-6}},
      {label:'Wait for committee scrutiny',detail:'Avoid a premature claim about legal changes.',effect:{credibility:1,energy:2}}
    ]
  },
  {
    id:'monsoon-closes-2026',date:'2026-08-13',region:'New Delhi',title:'The Monsoon Session concludes',
    fact:'Parliament adjourned on 13 August after 19 sittings. The ministry reported 12 Bills passed by both Houses; a public examinations amendment Bill was introduced.',
    scene:'The session closes. Your team reviews what passed, what was merely introduced and which student concerns still need an answer. You can publish an account or return to field work.',
    source:'Ministry of Parliamentary Affairs',url:'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2298901&lang=1&reg=3',
    choices:[
      {label:'Track the examination Bill',detail:'Explain what was introduced, without claiming it became law.',effect:{funds:-5000,credibility:4,media:1,energy:-5}},
      {label:'Report on session outcomes',detail:'Publish a balanced account of the session.',effect:{credibility:2,recognition:2,energy:-5}},
      {label:'Return to local organising',detail:'Focus on direct contact with supporters.',effect:{volunteers:18,support:1,energy:-6}}
    ]
  }
]);
