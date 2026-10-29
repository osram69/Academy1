-- Cube Academy — migrazione 8: tre articoli al posto dei tre eventi del vecchio sito.
-- Esegui nel SQL Editor di Supabase dopo migrazione-5.sql. È idempotente: sostituisce i tre eventi
-- iniziali (e i tre articoli, se la migrazione viene rieseguita) senza toccare gli altri eventi.
--
-- Gli articoli si modificano poi dal pannello (#/admin/eventi): immagine, descrizione nelle 4 lingue,
-- link, date. Un articolo senza date (come "Che cos'è iSAQB®") non mostra nessuna data sul sito.

delete from public.eventi where titolo in (
  'Italian Software Testing Forum 2025',
  'iSAQB® Software Architecture Gathering 2024',
  'Evento di presentazione iSAQB a Roma',
  'Cube Academy allo Italian Software Testing Forum 2025',
  'Cube Academy al Software Architecture Gathering 2024 di Berlino',
  'Che cos''è iSAQB®'
);

insert into public.eventi (titolo, pubblicato, data_inizio, data_fine, luogo, link_evento, immagine_url,
                           descrizione_it, descrizione_en, descrizione_fr, descrizione_de)
values

-- 1) Italian Software Testing Forum 2025 (stand iSAQB)
('Cube Academy allo Italian Software Testing Forum 2025', true, date '2025-05-21', date '2025-05-21',
 'Assago (Milano)', 'https://www.soiel.it/eventi/stf-2025-milano/',
 'https://academy.cubeng.eu/wp-content/uploads/2025/03/IMG_20250521_101701-scaled.jpg',
 $it$Il 21 maggio 2025 Cube Academy ha partecipato all'Italian Software Testing Forum (STF 2025), l'appuntamento italiano dedicato alla qualità del software, organizzato da Soiel International con ITA-STQB e ospitato all'NH Milano Congress Centre di Assago.

Eravamo presenti nello stand iSAQB®, che era tra i Platinum sponsor dell'evento. Allo stand abbiamo incontrato professionisti del testing, della qualità e dell'architettura software, raccontando il percorso di certificazione CPSA® e i corsi che organizziamo come Training Provider accreditato.

L'edizione 2025 è stata dedicata a come l'intelligenza artificiale e le nuove tecnologie cambiano la qualità del software: dall'uso dell'AI nello sviluppo e nel testing al testing dei sistemi di AI, fino ad architettura software, accessibilità e DevOps, con una sessione plenaria al mattino e due percorsi paralleli nel pomeriggio.

È stata un'occasione preziosa per confrontarci con la community italiana su un tema che lega da vicino qualità e architettura: un software ben progettato è più facile da testare, far evolvere e mantenere.$it$,
 $en$On 21 May 2025 Cube Academy took part in the Italian Software Testing Forum (STF 2025), the Italian event dedicated to software quality, organised by Soiel International with ITA-STQB and hosted at the NH Milano Congress Centre in Assago.

We were at the iSAQB® stand, as iSAQB was one of the event's Platinum sponsors. At the stand we met testing, quality and software architecture professionals and presented the CPSA® certification path and the courses we run as an accredited Training Provider.

The 2025 edition focused on how artificial intelligence and emerging technologies are changing software quality: from using AI in development and testing, to testing AI systems, to software architecture, accessibility and DevOps, with a plenary session in the morning and two parallel tracks in the afternoon.

It was a valuable chance to talk with the Italian community about a topic that links quality and architecture closely: well-designed software is easier to test, evolve and maintain.$en$,
 $fr$Le 21 mai 2025, Cube Academy a participé à l'Italian Software Testing Forum (STF 2025), le rendez-vous italien consacré à la qualité du logiciel, organisé par Soiel International avec ITA-STQB et accueilli au NH Milano Congress Centre d'Assago.

Nous étions présents sur le stand iSAQB®, l'un des sponsors Platine de l'événement. Sur le stand, nous avons rencontré des professionnels du test, de la qualité et de l'architecture logicielle, et présenté le parcours de certification CPSA® ainsi que les formations que nous proposons en tant que Training Provider accrédité.

L'édition 2025 était consacrée à la façon dont l'intelligence artificielle et les technologies émergentes transforment la qualité du logiciel : de l'usage de l'IA dans le développement et le test au test des systèmes d'IA, jusqu'à l'architecture logicielle, l'accessibilité et le DevOps, avec une session plénière le matin et deux parcours parallèles l'après-midi.

Ce fut une occasion précieuse d'échanger avec la communauté italienne sur un sujet qui relie étroitement qualité et architecture : un logiciel bien conçu est plus facile à tester, à faire évoluer et à maintenir.$fr$,
 $de$Am 21. Mai 2025 nahm Cube Academy am Italian Software Testing Forum (STF 2025) teil, dem italienischen Treffpunkt rund um Softwarequalität, veranstaltet von Soiel International mit ITA-STQB und zu Gast im NH Milano Congress Centre in Assago.

Wir waren am iSAQB®-Stand vertreten, denn iSAQB gehörte zu den Platin-Sponsoren der Veranstaltung. Am Stand trafen wir Fachleute aus Test, Qualitätssicherung und Softwarearchitektur und stellten den CPSA®-Zertifizierungsweg sowie unsere Kurse als akkreditierter Training Provider vor.

Die Ausgabe 2025 widmete sich der Frage, wie künstliche Intelligenz und neue Technologien die Softwarequalität verändern: vom Einsatz von KI in Entwicklung und Test über das Testen von KI-Systemen bis zu Softwarearchitektur, Barrierefreiheit und DevOps, mit einer Plenarsitzung am Vormittag und zwei parallelen Tracks am Nachmittag.

Es war eine wertvolle Gelegenheit, sich mit der italienischen Community über ein Thema auszutauschen, das Qualität und Architektur eng verbindet: Gut entworfene Software lässt sich leichter testen, weiterentwickeln und warten.$de$),

-- 2) Software Architecture Gathering 2024, Berlino (sponsor)
('Cube Academy al Software Architecture Gathering 2024 di Berlino', true, date '2024-11-11', date '2024-11-14',
 'Berlino', 'https://www.software-architecture-gathering.com/',
 'https://academy.cubeng.eu/wp-content/uploads/2024/07/Berlino-1024x440.jpg',
 $it$Dall'11 al 14 novembre 2024 Berlino ha ospitato il Software Architecture Gathering, la conferenza internazionale sull'architettura software organizzata da iSAQB® in collaborazione con heise conferences. Cube Academy ha partecipato come sponsor.

Per quattro giorni architetti, sviluppatori e responsabili tecnici si sono confrontati su strumenti, tecniche collaudate e tendenze dell'architettura software, tra sessioni, incontri e momenti di networking.

Esserci come sponsor ci permette di restare vicini alla community internazionale di iSAQB® e di portare nei nostri corsi ciò che emerge dal confronto con i professionisti del settore.

La prossima edizione si terrà a Berlino dal 16 al 19 novembre 2026, al Titanic Chaussee Berlin: il programma prevede otto percorsi tematici, oltre 55 sessioni e keynote, 10 workshop pratici e più di 65 relatori. Il sito ufficiale, collegato qui sotto, riporta il programma completo.$it$,
 $en$From 11 to 14 November 2024 Berlin hosted the Software Architecture Gathering, the international software architecture conference organised by iSAQB® in cooperation with heise conferences. Cube Academy took part as a sponsor.

For four days architects, developers and technical leads exchanged ideas on tools, proven techniques and trends in software architecture, through sessions, meetings and networking.

Being there as a sponsor keeps us close to the international iSAQB® community and lets us bring into our courses what comes out of conversations with professionals in the field.

The next edition will take place in Berlin from 16 to 19 November 2026 at the Titanic Chaussee Berlin: the programme includes eight thematic tracks, more than 55 sessions and keynotes, 10 hands-on workshops and over 65 speakers. The official website, linked below, has the full programme.$en$,
 $fr$Du 11 au 14 novembre 2024, Berlin a accueilli le Software Architecture Gathering, la conférence internationale sur l'architecture logicielle organisée par iSAQB® en collaboration avec heise conferences. Cube Academy y a participé en tant que sponsor.

Pendant quatre jours, architectes, développeurs et responsables techniques ont échangé sur les outils, les techniques éprouvées et les tendances de l'architecture logicielle, au fil de sessions, de rencontres et de moments de réseautage.

Être présents en tant que sponsor nous permet de rester proches de la communauté internationale iSAQB® et d'apporter à nos formations ce qui ressort des échanges avec les professionnels du secteur.

La prochaine édition aura lieu à Berlin du 16 au 19 novembre 2026, au Titanic Chaussee Berlin : le programme comprend huit parcours thématiques, plus de 55 sessions et keynotes, 10 ateliers pratiques et plus de 65 intervenants. Le site officiel, lié ci-dessous, présente le programme complet.$fr$,
 $de$Vom 11. bis 14. November 2024 war Berlin Gastgeber des Software Architecture Gathering, der internationalen Konferenz für Softwarearchitektur, die iSAQB® in Zusammenarbeit mit heise conferences veranstaltet. Cube Academy war als Sponsor dabei.

Vier Tage lang tauschten sich Architekten, Entwickler und technische Verantwortliche über Werkzeuge, bewährte Techniken und Trends der Softwarearchitektur aus, in Sessions, Gesprächen und beim Networking.

Als Sponsor bleiben wir nah an der internationalen iSAQB®-Community und bringen das, was aus dem Austausch mit Fachleuten entsteht, in unsere Kurse ein.

Die nächste Ausgabe findet vom 16. bis 19. November 2026 in Berlin im Titanic Chaussee Berlin statt: Das Programm umfasst acht Themen-Tracks, mehr als 55 Sessions und Keynotes, 10 praxisnahe Workshops und über 65 Sprecher. Auf der offiziellen Website, unten verlinkt, finden Sie das vollständige Programm.$de$),

-- 3) Articolo su iSAQB (senza date)
('Che cos''è iSAQB®', true, null, null, null, 'https://www.isaqb.org/about/association/',
 '/img/hero-structure.jpg',
 $it$iSAQB® (International Software Architecture Qualification Board) è un'associazione internazionale senza scopo di lucro che promuove l'architettura software come disciplina e sostiene i professionisti che vogliono diventare architetti solidi. Nasce dal German Software Architecture Board, fondato nel 2001, e dal 2008 ha il nome attuale; è guidata da volontari e dal 2018 affianca all'associazione una società operativa, iSAQB GmbH.

Oggi conta oltre 190 tra soci e aziende associate e più di 50.000 professionisti certificati CPSA® (Certified Professional for Software Architecture).

iSAQB non eroga corsi né esami: definisce i curricula e i regolamenti di formazione e di esame, e accredita i Training Provider e gli enti di certificazione indipendenti, seguendo la norma ISO/IEC 17024. Il percorso CPSA® prevede il livello Foundation e il livello Advanced; gli esami si svolgono presso gli enti di certificazione autorizzati.

Cube Academy è Training Provider accreditato iSAQB® dal 2024: i nostri corsi sono tenuti da docenti accreditati con materiale didattico accreditato e preparano all'esame CPSA-F, che si sostiene a parte presso l'ente autorizzato. Per i dettagli sugli esami in Italia consulta il sito di iSAQB Italia.$it$,
 $en$iSAQB® (International Software Architecture Qualification Board) is an international non-profit association that promotes software architecture as a discipline and supports professionals who want to become strong software architects. It grew out of the German Software Architecture Board, founded in 2001, and has had its current name since 2008; it is run by volunteers and since 2018 has been backed by an operating company, iSAQB GmbH.

Today it counts more than 190 members and member companies and over 50,000 certified CPSA® professionals (Certified Professional for Software Architecture).

iSAQB does not run courses or exams itself: it defines the curricula and the training and examination regulations, and accredits Training Providers and independent certification bodies, following the ISO/IEC 17024 standard. The CPSA® path includes the Foundation Level and the Advanced Level; exams are taken with authorised certification bodies.

Cube Academy has been an iSAQB®-accredited Training Provider since 2024: our courses are taught by accredited trainers using accredited training material and prepare for the CPSA-F exam, which is taken separately with the authorised body. For details on exams in Italy, see the iSAQB Italy website.$en$,
 $fr$iSAQB® (International Software Architecture Qualification Board) est une association internationale à but non lucratif qui promeut l'architecture logicielle comme discipline et soutient les professionnels qui souhaitent devenir de solides architectes. Elle est issue du German Software Architecture Board, fondé en 2001, et porte son nom actuel depuis 2008 ; elle est animée par des bénévoles et, depuis 2018, s'appuie sur une société opérationnelle, iSAQB GmbH.

Elle compte aujourd'hui plus de 190 membres et entreprises membres et plus de 50 000 professionnels certifiés CPSA® (Certified Professional for Software Architecture).

iSAQB ne dispense ni cours ni examens : elle définit les cursus et les règlements de formation et d'examen, et accrédite les Training Providers et les organismes de certification indépendants, selon la norme ISO/IEC 17024. Le parcours CPSA® comprend le niveau Foundation et le niveau Advanced ; les examens se passent auprès des organismes de certification autorisés.

Cube Academy est Training Provider accrédité iSAQB® depuis 2024 : nos formations sont dispensées par des formateurs accrédités avec du matériel pédagogique accrédité et préparent à l'examen CPSA-F, qui se passe séparément auprès de l'organisme autorisé. Pour les détails sur les examens en Italie, consultez le site d'iSAQB Italie.$fr$,
 $de$iSAQB® (International Software Architecture Qualification Board) ist ein internationaler gemeinnütziger Verband, der Softwarearchitektur als Disziplin fördert und Fachleute unterstützt, die starke Softwarearchitekten werden wollen. Er ging aus dem German Software Architecture Board hervor, das 2001 gegründet wurde, und trägt seit 2008 seinen heutigen Namen; er wird ehrenamtlich geführt und hat seit 2018 mit der iSAQB GmbH eine operative Gesellschaft an seiner Seite.

Heute zählt er über 190 Mitglieder und Mitgliedsunternehmen und mehr als 50.000 zertifizierte CPSA®-Fachleute (Certified Professional for Software Architecture).

iSAQB bietet selbst weder Kurse noch Prüfungen an: Er legt die Lehrpläne sowie die Schulungs- und Prüfungsordnungen fest und akkreditiert Training Provider und unabhängige Zertifizierungsstellen nach der Norm ISO/IEC 17024. Der CPSA®-Weg umfasst das Foundation Level und das Advanced Level; die Prüfungen legt man bei autorisierten Zertifizierungsstellen ab.

Cube Academy ist seit 2024 von iSAQB® akkreditierter Training Provider: Unsere Kurse werden von akkreditierten Trainern mit akkreditierten Schulungsunterlagen gehalten und bereiten auf die CPSA-F-Prüfung vor, die separat bei der autorisierten Stelle abgelegt wird. Details zu den Prüfungen in Italien finden Sie auf der Website von iSAQB Italien.$de$);
