/* Verified public events through 25 September 2026. Player responses are fictional. */
const REAL_SCENES = Object.freeze([
  {
    id:'assembly-kerala-2026',date:'2026-05-05',region:'Kerala',title:'A changed assembly map',
    fact:'The Election Commission reported 140 Kerala assembly results: INC won 63 seats, CPI(M) 26 and IUML 22.',
    source:'Election Commission of India',url:'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S11.htm',
    archive:true
  },
  {
    id:'assembly-bengal-2026',date:'2026-05-05',region:'West Bengal',title:'A decisive count in Bengal',
    fact:'At its 5 May update, the Election Commission showed BJP on 207 seats and AITC on 80, with 293 of 294 constituencies accounted for.',
    source:'Election Commission of India',url:'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm',
    archive:true
  },
  {
    id:'neet-reexam-2026',date:'2026-06-21',region:'National',title:'The medical entrance examination is held again',
    fact:'The National Testing Agency held the NEET (UG) 2026 re-examination on 21 June, following the examination held on 3 May.',
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
    source:'Ministry of Parliamentary Affairs',url:'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2298901&lang=1&reg=3',
    choices:[
      {label:'Track the examination Bill',detail:'Explain what was introduced, without claiming it became law.',effect:{funds:-5000,credibility:4,media:1,energy:-5}},
      {label:'Report on session outcomes',detail:'Publish a balanced account of the session.',effect:{credibility:2,recognition:2,energy:-5}},
      {label:'Return to local organising',detail:'Focus on direct contact with supporters.',effect:{volunteers:18,support:1,energy:-6}}
    ]
  }
]);
