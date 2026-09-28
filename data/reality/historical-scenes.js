/* Reported public events through 28 September 2026. Player responses are fictional. */
const MILESTONE_RESPONSES={
 "court-clarification":[["Read the full account","Put the reported remark and the later clarification side by side.",{credibility:3,energy:-5}],["Ask a lawyer to explain the hearing","Give volunteers context before they repeat a clipped quote.",{credibility:2,legal:-1,energy:-5}],["Hold an open student meeting","Let students respond without treating a disputed interpretation as settled fact.",{support:2,energy:-6}]],
 "cjp-founded":[["Invite careful volunteers","Start a small team with a code of conduct.",{volunteers:14,credibility:1,energy:-6}],["Write the first public note","Explain what the new movement can and cannot claim.",{media:2,credibility:2,energy:-5}],["Talk to students first","Listen before announcing a wider campaign.",{support:2,energy:-5}]],
 "cjp-jantar":[["Set up water and first aid","Protect people in the crowd during the reported gathering.",{funds:-2500,credibility:2,volunteers:4,energy:-5}],["Assign a legal liaison","Document police conditions and emergency contacts.",{funds:-2500,legal:-2,energy:-5}],["Run a listening circle","Give affected students space to name their priorities.",{support:2,volunteers:5,energy:-7}]],
 "cjp-extension":[["Read the police order","Ask counsel to verify the permitted time and lawful alternatives.",{legal:-3,credibility:2,energy:-5}],["Help people leave safely","Coordinate exits and protect vulnerable attendees.",{credibility:2,volunteers:3,energy:-5}],["Request a fresh site","Seek another legal venue for the movement.",{media:1,legal:-1,energy:-6}]],
 "cjp-minister":[["Record the announced outcome","Keep the public claim precise and ask what examination changes follow.",{credibility:3,energy:-5}],["Thank the field volunteers","Retain the people who carried the campaign through the long weeks.",{volunteers:12,energy:-5}],["Meet affected students again","Ask what remains unresolved after the reported resignation.",{support:2,energy:-6}]],
 "cjp-pressure-group":[["Open local listening cells","Build a national civic network under the reported pressure-group strategy.",{volunteers:12,support:1,energy:-7}],["Create a public ledger","Publish the movement's finances and decision rules.",{credibility:3,energy:-5}],["Train field researchers","Turn protest momentum into careful documentation.",{credibility:2,volunteers:5,energy:-6}]],
 "cjp-schools":[["Obtain school permissions","Agree on privacy and access before a fictional local audit.",{legal:-2,credibility:2,energy:-5}],["Build an evidence checklist","Record facilities without identifying children.",{credibility:3,energy:-6}],["Hear teachers and parents","Collect conflicting accounts before reaching a conclusion.",{support:2,energy:-6}]],
 "cjp-latur-fir":[["Preserve the visit records","Seek a lawyer and avoid presuming anyone's guilt.",{legal:-3,credibility:2,energy:-5}],["Ask for an independent account","Document witnesses and invite the institution's response.",{credibility:3,energy:-6}],["Pause new school visits","Review permissions while reducing exposure.",{legal:-2,media:-2,energy:2}]],
 "cjp-march-withdrawn":[["Explain the withdrawal","Share what was promised and how volunteers can monitor it.",{credibility:2,energy:-5}],["Track the cases","Ask the legal desk to follow the court proceedings.",{legal:-2,energy:-6}],["Move to local meetings","Keep organisers engaged without claiming a march took place.",{volunteers:7,energy:-6}]],
 "cjp-adivasi-schools":[["Invite local leadership","Let families and community members set the questions for a fictional audit.",{support:2,credibility:2,energy:-6}],["Request inspection records","Seek public facilities data before alleging deficiencies.",{credibility:3,energy:-5}],["Train privacy stewards","Keep children and witnesses out of campaign imagery.",{legal:-2,credibility:2,energy:-5}]],
 "cjp-eci-demand":[["Read the underlying records","Check the electoral-roll allegations before repeating them.",{credibility:3,energy:-5}],["Request an official response","Put specific questions to the election authority.",{credibility:2,media:1,energy:-5}],["Prepare lawful assembly plans","Check safety and permissions without presuming an outcome.",{volunteers:6,energy:-6}]]
};
const REAL_SCENES = Object.freeze([
  {
    id:"court-clarification",date:"2026-05-25",region:"New Delhi",title:"The viral remark and the clarification",
    fact:"Reporting describes how the May 15 courtroom remark was widely read as disparaging young people. The Chief Justice subsequently said his criticism concerned people using bogus qualifications in professions, not India's youth. The interpretations remain distinct.",
    scene:"Your group chat shares a clipped quote. A friend forwards the clarification. You can put both before volunteers without deciding what they must believe.",
    source:"The Indian Express",url:"https://indianexpress.com/article/legal-news/cji-plea-cockroach-janta-party-campaign-sentimental-10706687/",status:"DISPUTED",publishedOn:"2026-05-25",classification:"REPORTED_REMARK_AND_CLARIFICATION"
  },

  {
    id:"cjp-founded",date:"2026-05-16",region:"Maharashtra",title:"Cockroach Janta Party takes shape",
    fact:"After a Supreme Court hearing drew criticism, Abhijeet Dipke launched CJP as a satirical online movement on 16 May 2026.",scene:"A name born online becomes a sign-up form. Nobody yet knows whether it can survive outside a screen.",
    source:"Indian Express",url:"https://indianexpress.com/article/india/cjp-protest-timeline-five-key-moments-dharmendra-pradhan-resignation-10803274/",status:"REPORTED",archive:true
  },
  {
    id:"cjp-jantar",date:"2026-06-06",region:"New Delhi",title:"CJP gathers at Jantar Mantar",
    fact:"CJP founder Abhijeet Dipke and supporters protested at Jantar Mantar over examination-related concerns and demanded the Education Minister’s resignation.",scene:"A pavement becomes a political stage. Volunteers have to manage people, food, media and the limits of a permitted protest.",
    source:"The Indian Express",url:"https://indianexpress.com/article/cities/delhi/cockroach-janta-party-abhijeet-dipke-delhi-airport-jantar-mantar-protest-10726512/",status:"REPORTED",archive:true
  },
  {
    id:"cjp-extension",date:"2026-06-20",region:"New Delhi",title:"The protest faces a police deadline",
    fact:"Media reported that police declined an extension to CJP’s permitted Jantar Mantar protest and moved to clear the site.",scene:"A movement learns that the right to assemble also has permits, deadlines and tense conversations with police.",
    source:"India Today",url:"https://www.indiatoday.in/india/story/cockroach-janta-party-protest-jantar-mantar-cjp-founder-abhijit-dipke-neet-paper-leak-education-minister-dharmendra-pradhan-delhi-police-2930592-2026-06-20",status:"REPORTED",archive:true
  },
  {
    id:"cjp-minister",date:"2026-07-25",region:"New Delhi",title:"An education minister resigns",
    fact:"The Indian Express reported Dharmendra Pradhan’s resignation as Union Education Minister after the examination protests. The movement claimed a political victory.",scene:"Jubilation at the protest site is followed by a harder question: what does the movement do after a headline victory?",
    source:"The Indian Express",url:"https://indianexpress.com/article/india/cjp-protest-timeline-five-key-moments-dharmendra-pradhan-resignation-10803274/",status:"REPORTED",archive:true
  },
  {
    id:"cjp-pressure-group",date:"2026-08-05",region:"Maharashtra",title:"CJP chooses pressure-group work",
    fact:"At an August press conference, Abhijeet Dipke said CJP did not plan an immediate electoral entry and would work as a nationwide pressure group.",scene:"The organisation resists the quickest route to a ballot symbol. It needs a way to keep volunteers engaged between protests.",
    source:"The Times of India",url:"https://timesofindia.indiatimes.com/city/aurangabad/cockroach-janta-party-rules-out-electoral-plunge-plans-nationwide-movement/articleshow/132959602.cms",status:"ATTRIBUTED STATEMENT",archive:true
  },
  {
    id:"cjp-schools",date:"2026-08-15",region:"Maharashtra",title:"School Thik Karo expands the agenda",
    fact:"CJP launched a school-focused social-audit campaign. Reported concerns about facilities required verification and responses from the relevant authorities.",scene:"A school gate is different from a protest stage. Evidence, permission and the dignity of teachers and children now matter.",
    source:"India Today",url:"https://www.indiatoday.in/india/story/school-thik-karo-abhijeet-dipke-government-schools-maharashtra-ptag-2971917-2026-08-15",status:"REPORTED",archive:true
  },
  {
    id:"cjp-latur-fir",date:"2026-08-22",region:"Maharashtra",title:"An FIR follows a Latur school visit",
    fact:"Police registered an FIR following a complaint about a CJP school visit in Latur. The complaint contains allegations; this archive records no finding of guilt.",scene:"Legal exposure is no longer abstract. Your future team will inherit the need for careful documentation and due process.",
    source:"India Today",url:"https://www.indiatoday.in/india/story/abhijeet-dipke-maharashtra-latur-school-fir-cjp-fir-over-threats-teachers-2977633-2026-08-22",status:"UNDER INVESTIGATION",archive:true
  },
  {
    id:"cjp-march-withdrawn",date:"2026-09-01",region:"New Delhi",title:"A planned march is withdrawn",
    fact:"CJP withdrew its planned 5 September Delhi march after government assurances and Supreme Court proceedings concerning protest-related cases.",scene:"Sometimes de-escalation is a strategic choice. The promised resolution still needs to be watched.",
    source:"The Indian Express",url:"https://indianexpress.com/article/legal-news/cjp-supreme-court-delhi-police-quash-cases-against-cjp-protesters-10858482/",status:"REPORTED",archive:true
  },
  {
    id:"cjp-adivasi-schools",date:"2026-09-16",region:"Maharashtra",title:"Adivasi School Thik Karo is announced",
    fact:"Dipke announced an Adivasi School Thik Karo campaign focused on conditions in tribal-area schools. Reported deficiencies are campaign claims requiring local verification.",scene:"A small field team now faces questions that cannot be answered by a national slogan alone.",
    source:"The Indian Express",url:"https://indianexpress.com/article/cities/mumbai/cjp-abhijeet-dipke-next-project-adivasi-school-thik-karo-campaign-maharashtra-10880843/",status:"REPORTED",archive:true
  },
  {
    id:"cjp-eci-demand",date:"2026-09-24",region:"New Delhi",title:"CJP turns to electoral accountability",
    fact:"CJP demanded Chief Election Commissioner Gyanesh Kumar’s resignation and said it could organise another Jantar Mantar protest. Its allegations about electoral-roll changes remain claims to examine, not established findings in this game.",scene:"The ultimatum is public. On the next day, your fictional career can begin with a live political question and no known outcome.",
    source:"The Indian Express",url:"https://indianexpress.com/article/political-pulse/cjp-demands-election-commissioner-gyanesh-kumar-resignation-jantar-mantar-10892653/",status:"ATTRIBUTED CLAIM",archive:true
  },
  {
    id:"cjp-image-case",date:"2026-09-25",region:"New Delhi",title:"A court orders removal of morphed images",
    fact:"NDTV reported that the Delhi High Court directed Meta to remove a woman's objectionable morphed images and issued notices to CJP leaders. An FIR named unknown persons; notices do not establish the leaders' guilt.",
    scene:"The movement's public reach now carries a duty to protect a private person. The historical court action stands regardless of your response.",
    source:"NDTV",url:"https://www.ndtv.com/india-news/high-court-asks-meta-to-remove-womans-morphed-images-cjp-leaders-get-notices-12097306",status:"REPORTED COURT ACTION",
    choices:[{label:"Protect the affected person",detail:"Ask volunteers to remove copies and document the response without sharing the images.",effect:{credibility:3,energy:-5}},{label:"Seek legal advice",detail:"Preserve evidence and clarify responsibilities while respecting the court's direction.",effect:{funds:-4000,legal:-3,energy:-4}}]
  },
  {
    id:"cjp-mumbai-permission",date:"2026-09-27",region:"Mumbai",title:"Permission is denied for an October gathering",
    fact:"The Times of India reported that Mumbai Police declined permission for CJP's proposed October 2 gathering and that CJP announced a Jail Bharo agitation. The October 2 event itself has not happened in this historical record.",
    scene:"The field team must read the written reasons, consider access to hospitals and protect a peaceful route forward. The police decision and CJP announcement are historical; your planning is a game response.",
    source:"The Times of India",url:"https://timesofindia.indiatimes.com/city/mumbai/cockroach-janta-party-announces-jail-bharo-andolan-after-mumbai-police-denies-protest-permission/articleshow/134525016.cms",status:"REPORTED",
    choices:[{label:"Review the permit refusal",detail:"Ask counsel to check the stated reasons and consider an alternative location.",effect:{funds:-5000,credibility:3,legal:-2,energy:-5}},{label:"Prepare volunteer safety",detail:"Map accessibility, crowd safety and emergency routes for any lawful gathering.",effect:{funds:-6000,volunteers:12,energy:-6}}]
  },
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
].map(scene=>Object.freeze({...scene,archive:scene.date<"2026-05-14",choices:scene.date<"2026-05-14"?undefined:(scene.choices??(MILESTONE_RESPONSES[scene.id]?.map(([label,detail,effect])=>({label,detail,effect}))??[{label:"Verify and brief",detail:"Document the situation before speaking.",effect:{credibility:2,energy:-5}},{label:"Organise locally",detail:"Mobilise volunteers while preserving the reported facts.",effect:{volunteers:5,energy:-7}},{label:"Observe and protect your time",detail:"Study the report while maintaining your job.",effect:{energy:3}}]))})).sort((a,b)=>a.date.localeCompare(b.date)));
