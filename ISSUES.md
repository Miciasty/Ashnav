# Ashnav — ISSUES

## Cel pliku

Ten plik powstał 2026-09-09 po przeglądzie wspólnych zasad Blackframe i przyjęciu [blackframe.md, rewizja 2.0](../blackframe.md). Służy do zaplanowania korekt tej biblioteki oraz przekazywania pracy między kolejnymi, niezależnymi sesjami. Nie trzeba znać historii rozmowy: poniżej są powód zadania, miejsca w kodzie, kryteria odbioru i powiązania z innymi projektami.

To lista prac i miejsce zapisu dowodów, a nie dokumentacja gotowych funkcji ani informacja, że błędy już naprawiono. Nie wszystkie pozycje są błędami wykonania: część wymaga doprecyzowania umowy z użytkownikiem lub sprawdzenia istniejących zabezpieczeń. Przegląd obejmował README, POM, workflow i wybrane źródła/testy; nie jest pełnym audytem całego kodu. Podczas przygotowania pliku nie zmieniano implementacji i nie uruchamiano testów bibliotek.

## Punkt odniesienia

- Rola projektu: Szukanie tras po grafach i projekcjach siatki, z opcjonalnym mapowaniem współrzędnych świata.
- Wersja zadeklarowana w lokalnym POM: **1.0.0**. To nie jest potwierdzenie publikacji.
- Stan źródeł podczas przygotowania: **08e7d26** na gałęzi docs/blackframe-contract-v2-20260909; commit zapisuje stan sprzed zmian dokumentacji.
- Zależności: Ashcore 1.0.1, Ashgrid 1.2.0 i Ashspace 1.0.0. Brak zależności od Ashtrace/Ashmesh jest zgodny z kontraktem.
- Dokument nadrzędny: rewizja **2.0 z 2026-09-09**. Numery sekcji w zadaniach odnoszą się do tej rewizji.

## Jak rozpocząć nową sesję

1. Przeczytaj lokalne AGENTS.md/instrukcje użytkownika, [kontrakt Blackframe](../blackframe.md) i cały ten plik. Jeśli kontraktu brakuje w osobnym klonie, uzyskaj właściwą rewizję przed rozstrzyganiem wspólnych zasad.
2. Sprawdź aktualny Git i różnice względem powyższego punktu odniesienia. W tej pracy obowiązywała instrukcja użytkownika: przed zmianami utworzyć nową gałąź i zacommitować obecną wersję. Zachowaj cudze zmiany; nie resetuj repozytorium. Dla katalogu bez Git nie wymyślaj istniejącego commita.
3. Zacznij od wskazanego P1, odtwórz obserwację i sprawdź istniejące testy. Ustal kontrakt przed korektą zachowania. Wpis INSPEKCJA nie zastępuje reprodukcji.
4. Naprawiaj zadania w granicach tego projektu. Zmianę wspólnego kontraktu prowadź u właściciela niższej warstwy, a potrzebną pracę w innym repozytorium zapisz pod jego ID. Rutynowa poprawka nie wymaga edycji blackframe.md.
5. Po zmianach uruchom odpowiednie testy i końcowe clean verify. Aktualizuj statusy i dziennik poniżej: co zmieniono, rzeczywisty wynik kontroli, decyzje zgodności, pozostałe zależności i następny krok. Nie publikuj artefaktów tylko po to, aby sprawdzić kod.

Zalecana kolejność ustaleń wspólnych: Ashcore → Ashgrid → Ashspace, następnie Ashtrace i Ashnav zgodnie z ich zależnościami. Ashnav nie musi czekać na Ashtrace; niezależne zadania lokalne można podejmować wcześniej. Ashtemplate można poprawiać osobno. Ashmesh nie ma obecnie lokalnego katalogu, więc ten backlog nie zleca jego implementacji.

Maven używa zależności rozstrzygniętych z POM i repozytoriów artefaktów. Zmiana pliku w sąsiednim checkout nie podmienia ich automatycznie. Przy integracji zapisz konkretne wersje, commity i wynik rozstrzygnięcia zależności. Dla próbnego builda dolnej warstwy użyj odróżnialnej wersji roboczej lub izolowanego repozytorium testowego; nie nadpisuj istniejącego wydania inną zawartością.

## Oznaczenia

- **P1** — poprawność, publiczne gwarancje lub wymagana weryfikacja; rozstrzygnąć przed deklaracją zgodności z rewizją 2.0 i następnym wydaniem objętego zakresu.
- **P2** — porządkowanie lub pogłębiona kontrola po pilnych korektach; nie pomijać bez zapisanej decyzji.
- **INSPEKCJA** — potwierdzony zapis lub mechanizm w źródle; podany skutek może wymagać jeszcze testu wykonania.
- **AUDYT** — zakres do sprawdzenia, bez twierdzenia, że wszystkie wymienione miejsca są błędne.
- **DECYZJA** — trzeba wybrać i udokumentować wspierany kontrakt lub migrację.
- Statusy: **OTWARTE**, **W TOKU**, **ZABLOKOWANE** (z konkretną zależnością), **GOTOWE** (z dowodem spełnienia kryteriów), **NIE DOTYCZY** (z uzasadnieniem). Zachowuj identyfikatory po zamknięciu.

## Kolejka

| ID | Priorytet | Typ | Zadanie |
| --- | --- | --- | --- |
| [NAV-001](#nav-001) | P1 | INSPEKCJA | Domknąć warunki optymalności A* |
| [NAV-002](#nav-002) | P1 | INSPEKCJA | Wyjaśnić model ruchu, koszty i snapshot siatki |
| [NAV-003](#nav-003) | P1 | INSPEKCJA | Ustalić spójność grafu w moście world→node |
| [NAV-004](#nav-004) | P1 | INSPEKCJA | Sprawdzić przepełnienie objętości i właściciela storage |
| [NAV-005](#nav-005) | P1 | INSPEKCJA | Poprawić rachunek czasu i pamięci wyszukiwania |
| [NAV-006](#nav-006) | P1 | INSPEKCJA | Doprecyzować duplikaty krawędzi i dane wpływające na wynik |
| [NAV-007](#nav-007) | P1 | DECYZJA | Zdefiniować API stabilne dla użytkownika i odświeżyć README |
| [NAV-008](#nav-008) | P1 | INSPEKCJA | Dostosować CI, pakowanie i dowody wydania |
| [NAV-009](#nav-009) | P2 | DECYZJA | Dodać wznawiane i anulowane wyszukiwanie |
| [NAV-010](#nav-010) | P2 | DECYZJA | Rozdzielić politykę ruchu i kosztów od mapowania siatki |
| [NAV-011](#nav-011) | P2 | INSPEKCJA | Usprawnić iterację ważonych krawędzi i zmierzyć zmianę |
| [NAV-012](#nav-012) | P2 | DECYZJA | Powiązać nawigację z lokalnymi układami Ashspace |

<a id="nav-001"></a>

## NAV-001 — Domknąć warunki optymalności A*

**Status:** GOTOWE<br>
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 3.6, 4.2, 4.5

**Gdzie:** [IntHeuristic.java](src/main/java/nsk/nu/ashnav/api/path/IntHeuristic.java), [AStarPathfinder.java](src/main/java/nsk/nu/ashnav/implementation/path/AStarPathfinder.java), [AStarPathfinderTest.java](src/test/java/nsk/nu/ashnav/implementation/path/AStarPathfinderTest.java).

**Stan podczas przeglądu:** IntHeuristic wymaga tylko skończonej wartości >=0. AStarPathfinder zamyka węzły na stałe i pomija zamkniętych sąsiadów. To nie wystarcza do reklamowanej optymalności dla wszystkich heurystyk dopuszczonych przez interfejs. Obecny test nazwany admissible używa też heurystyki spójnej, więc nie rozstrzyga różnicy.

**Znaczenie:** Algorytm może powtarzalnie zwracać droższą trasę. Heurystyka to podpowiedź, ile kosztuje reszta drogi; musi spełniać warunki wybranego wariantu A*.

**Praca do wykonania:** Odtwórz dwa przykłady. (1) S→G=10, S→A=1, A→G=1, h(A)=100, pozostałe h=0: obecny kontrakt dopuszcza podpowiedź, ale koszt optimum wynosi 2. (2) S→A=3, S→B=1, B→A=1, A→G=2; h(S)=0, h(A)=0, h(B)=3, h(G)=0: podpowiedź nie zawyża kosztu, lecz jest niespójna; optimum wynosi 4, a zamknięcie A za wcześnie może dać 5. Wybierz jawny kontrakt spójności albo obsługę ponownego otwierania dla heurystyk dopuszczalnych.

**Warunki zamknięcia:**

- [x] Testy rozdzielają heurystykę spójną, dopuszczalną niespójną i zawyżającą; oczekiwana gwarancja odpowiada wybranemu wariantowi.
- [x] Dla obsługiwanych heurystyk koszt zgadza się z Dijkstrą/prostym wzorcem na małych grafach; ścieżki porównuje się osobno od remisów.
- [x] API i README opisują h(goal)=0, właściwe jednostki i pozostałe wymagania. Nie twierdzą, że sama lokalna walidacja finite/>=0 sprawdza globalną spójność.
- [x] Zmianę kontraktu oceniono pod względem zgodności; nie oznaczono zadania jako naprawione po samym przemianowaniu testu.

**Realizacja 2026-09-10:** A* ponownie otwiera węzeł wyłącznie przy ściśle niższym g; równy koszt zachowuje pierwszego rodzica. Sprawdzane jest h(goal)=0; dopuszczalność pozostaje warunkiem klienta. Odtworzono koszt 5 zamiast 4, potem potwierdzono 4; test zawyżania zwraca 10 zamiast optimum 2 zgodnie z ograniczeniem gwarancji. Wzorzec Floyd–Warshalla na 80 małych grafach porównuje osobno koszty, poprawność tras i powtarzalność. visitedNodeCount liczy różne węzły. Szczegóły i polecenia: [VERIFICATION.md](VERIFICATION.md).

**Powiązania:** [NAV-005](../Ashnav/ISSUES.md#nav-005) aktualizuje koszty po wyborze wariantu. Uzasadnienie: materiały CS188 wskazane w ../blackframe.md.

<a id="nav-002"></a>

## NAV-002 — Wyjaśnić model ruchu, koszty i snapshot siatki

**Status:** GOTOWE<br>
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 3.6, 4.1, 4.2, 5.1

**Gdzie:** [GridWalkabilityGraph3.java](src/main/java/nsk/nu/ashnav/implementation/grid/GridWalkabilityGraph3.java), [GridNeighborhood3.java](src/main/java/nsk/nu/ashnav/api/grid/GridNeighborhood3.java), [BfsPathfinder.java](src/main/java/nsk/nu/ashnav/implementation/path/BfsPathfinder.java), [GridWalkabilityGraph3Test.java](src/test/java/nsk/nu/ashnav/implementation/grid/GridWalkabilityGraph3Test.java), [README.md](README.md).

**Stan podczas przeglądu:** Projekcja łączy dopuszczone komórki według offsetów sąsiedztwa; nie sprawdza przestrzeni pośredniej ani gabarytów postaci. Mapowanie komórek powstaje w konstruktorze, więc późniejsza zmiana siatki nie przebudowuje grafu. BFS minimalizuje liczbę krawędzi i zwraca ją jako totalCost; koszty przekątnych w grafie są geometryczne w jednostkach siatki.

**Znaczenie:** Droga w modelu punktowym może przechodzić po przekątnej między przeszkodami, przez które postać się nie zmieści. Najmniej kroków nie musi oznaczać najniższego kosztu.

**Praca do wykonania:** Zachowaj obecne ostrzeżenie README o regułach Minecrafta i rozszerz je o przekątne, podparcie i miejsce nad głową, jednostki kosztu oraz snapshot, czyli zapis stanu siatki w chwili budowy grafu. Opisz BFS kontra Dijkstra/A*. Jeżeli potrzebna jest filtrowana łączność, zaprojektuj ogólny adapter/politykę albo pokaż własny graf, bez zaszywania silnika gry.

**Warunki zamknięcia:**

- [x] Mały przykład z dwoma blokującymi bokami pokazuje faktyczne zachowanie przejścia diagonalnego; dokumentacja nie obiecuje kolizyjnej przechodniości postaci.
- [x] Test potwierdza relację modyfikacji siatki i już zbudowanego grafu; sposób odświeżania jest opisany.
- [x] Przykład trasy bezpośredniej kosztu 10 i dwukrokowej kosztu 2 wyjaśnia różne cele BFS i Dijkstry oraz znaczenie totalCost.
- [x] Wskazano, czy koszt oznacza kroki, odległość siatkową czy koszt klienta; mapowanie świata nie zmienia go automatycznie na metry.

**Realizacja 2026-09-10:** Testy sprawdzają diagonalne przejście między dwoma zablokowanymi bokami, niezmienność już zbudowanego grafu po edycji siatki oraz BFS koszt 1 kontra Dijkstra/A* koszt 2 na trasach 10 i 1+1. README i Javadoc określają snapshot, odświeżanie, jednostki oraz obowiązki polityki ruchu. Szczegóły i polecenia: [VERIFICATION.md](VERIFICATION.md).

**Powiązania:** [GRID-002](../Ashgrid/ISSUES.md#grid-002) oraz [GRID-004](../Ashgrid/ISSUES.md#grid-004) określają sąsiedztwo i mutację; brak potrzeby wdrażania silnika fizyki.

<a id="nav-003"></a>

## NAV-003 — Ustalić spójność grafu w moście world→node

**Status:** GOTOWE<br>
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 3.6, 4.2, 4.3

**Gdzie:** [SpaceMappedGridNavigator3.java](src/main/java/nsk/nu/ashnav/implementation/grid/SpaceMappedGridNavigator3.java), [Pathfinder.java](src/main/java/nsk/nu/ashnav/api/path/Pathfinder.java), [SpaceMappedGridNavigator3IntegrationTest.java](src/test/java/nsk/nu/ashnav/integration/SpaceMappedGridNavigator3IntegrationTest.java).

**Stan podczas przeglądu:** Navigator mapuje punkty przez własny graph, ale findPath przyjmuje dowolny Pathfinder. API nie określa tu jawnie zgodności grafu/ID solvera. Punkty bez węzła są zamieniane na unreachable(0), tak jak brak ścieżki w poprawnym grafie.

**Znaczenie:** Dwa grafy mogą używać ID 0 i 1 dla innych miejsc. Wynik solvera może wtedy odnosić się do innej mapy niż pozycje użytkownika.

**Praca do wykonania:** Zdefiniuj warunek wspólnej tożsamości/modelu grafu lub bezpieczny sposób wiązania solvera z navigatorem. Sprawdź dwa grafy o tej samej liczbie węzłów i odmiennej łączności. Ustal i opisz znaczenie unreachable dla punktu poza mapą; osobny status dodaj tylko jeśli potrzebny, z analizą zgodności.

**Warunki zamknięcia:**

- [x] Test z solverem z innego grafu potwierdza wybraną politykę: wykrywanie niezgodności albo wyraźny kontrakt/prowadzący użytkownika interfejs.
- [x] Integracja obejmuje przesunięty origin, niejednostkowy cellSize, punkty graniczne i zablokowane komórki.
- [x] Opis odróżnia niepoprawne wejście, punkt bez węzła i brak drogi w ramach faktycznie oferowanego API.

**Realizacja 2026-09-10:** Dodano GraphPathfinder z tożsamością grafu; wszystkie wbudowane solvery go implementują. Navigator odrzuca inne instancje grafu, także o tej samej liczbie węzłów. Zachowano funkcjonalny Pathfinder i lambdy z jawnym obowiązkiem wspólnego modelu. Testy obejmują różną łączność, origin (-4,8,16), cellSize=2, granice, blokady, niepoprawne wejście i brak trasy. Szczegóły i polecenia: [VERIFICATION.md](VERIFICATION.md).

**Powiązania:** [SPACE-001](../Ashspace/ISSUES.md#space-001) oraz [SPACE-003](../Ashspace/ISSUES.md#space-003); API koordynować z [NAV-007](../Ashnav/ISSUES.md#nav-007).

<a id="nav-004"></a>

## NAV-004 — Sprawdzić przepełnienie objętości i właściciela storage

**Status:** GOTOWE<br>
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 2, 3.2, 3.6, 4.3, 4.5, 5

**Gdzie:** [IntArrayGrid3i.java](src/main/java/nsk/nu/ashnav/implementation/grid/IntArrayGrid3i.java), [GridWalkabilityGraph3.java](src/main/java/nsk/nu/ashnav/implementation/grid/GridWalkabilityGraph3.java), [IntArrayGrid3iTest.java](src/test/java/nsk/nu/ashnav/implementation/grid/IntArrayGrid3iTest.java).

**Stan podczas przeglądu:** Obie klasy mnożą trzy wymiary po rzutowaniu na long, lecz nie sprawdzają przepełnienia samego long. W IntArrayGrid3i wymiary 1073741824 × 1073741824 × 16 dają matematycznie 2^64, czyli po zawinięciu long zero; kontrola volume > Integer.MAX_VALUE tego nie wykrywa. IntArrayGrid3i jest też ogólnym storage siatki w warstwie nawigacji.

**Znaczenie:** Walidacja może zaakceptować olbrzymią siatkę z pustym buforem. Przenoszenie storage bez planu z kolei zepsułoby istniejący quick start.

**Praca do wykonania:** Odtwórz przykład bez dużej alokacji. Sprawdzaj iloczyn bez przepełnienia i waliduj własne implementacje BoundedGrid3i. Porównaj możliwości ArrayGrid3i z Ashgrid; zdecyduj o utrzymaniu helpera kompatybilności lub migracji do dolnej warstwy, bez usuwania istniejącego publicznego typu.

**Warunki zamknięcia:**

- [x] Skrajne dodatnie wymiary są odrzucane przed alokacją; test powyższego przypadku nie wymaga ogromnej pamięci.
- [x] Projekcja obsługuje niepoprawne wymiary wejściowego interfejsu zgodnie z jawnym kontraktem.
- [x] Podjęto udokumentowaną decyzję dotyczącą storage; quick start i publiczne konstruktory mają ciągłość albo wersjonowaną migrację.

**Realizacja 2026-09-10:** Wspólny prywatny dla pakietu GridDimensions sprawdza dodatnie wymiary i porównuje bezpieczny iloczyn dwóch wymiarów z limitem podzielonym przez trzeci. Test 2^64 odtwarzał przyjęcie pustego bufora; po poprawce jest odrzucany przed alokacją. Niestandardowe BoundedGrid3i są sprawdzane przed get. IntArrayGrid3i zostaje wspieranym helperem zgodności; nowe ogólne storage należy do Ashgrid.ArrayGrid3i, bez migracji publicznego typu w tym zadaniu. Szczegóły i polecenia: [VERIFICATION.md](VERIFICATION.md).

**Powiązania:** [GRID-004](../Ashgrid/ISSUES.md#grid-004) oraz [GRID-006](../Ashgrid/ISSUES.md#grid-006); przechowywanie danych należy docelowo do Ashgrid, ale zgodność pozostaje obowiązkiem [NAV-007](../Ashnav/ISSUES.md#nav-007).

<a id="nav-005"></a>

## NAV-005 — Poprawić rachunek czasu i pamięci wyszukiwania

**Status:** GOTOWE<br>
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 4.4, 5.1

**Gdzie:** [README.md](README.md), [WeightedAdjacencyIntGraph.java](src/main/java/nsk/nu/ashnav/implementation/graph/WeightedAdjacencyIntGraph.java), [AStarPathfinder.java](src/main/java/nsk/nu/ashnav/implementation/path/AStarPathfinder.java), [DijkstraPathfinder.java](src/main/java/nsk/nu/ashnav/implementation/path/DijkstraPathfinder.java).

**Stan podczas przeglądu:** README podaje O((V+E) log V) i O(V) pamięci. Wbudowany WeightedAdjacencyIntGraph.edgeCost liniowo przeszukuje wiersz przy każdym odczycie kosztu; solver robi to dla kolejnych sąsiadów. PriorityQueue przechowuje nowe State zamiast aktualizować jeden wpis węzła. Potrzebny jest rachunek uwzględniający te szczegóły.

**Znaczenie:** Węzeł z wieloma sąsiadami może powodować wielokrotne przeglądanie tej samej listy. W kolejce może znajdować się kilka wpisów tego samego węzła.

**Praca do wykonania:** Rozdziel koszt abstrakcyjnego grafu i konkretnej implementacji. Uwzględnij sumę kwadratów stopni dla liniowych odczytów edgeCost tam, gdzie każdy wiersz jest w ten sposób skanowany, koszt kolejki zależny od liczby wpisów, tablice i pamięć wyniku. Po [NAV-001](../Ashnav/ISSUES.md#nav-001) uwzględnij ewentualne ponowne otwieranie węzłów.

**Warunki zamknięcia:**

- [x] Tabela i Javadoc podają założenia kosztu forEachNeighbor/edgeCost oraz poprawne granice pamięci kolejki.
- [x] Przykład grafu o dużym stopniu wyjaśnia praktyczne ograniczenie; nie zmieniono tylko symboli bez analizy kodu.
- [x] Ewentualna optymalizacja lookupu lub iteracji ważonych krawędzi zachowuje semantykę duplikatów/remisów i ma adekwatny pomiar.

**Realizacja 2026-09-10:** README i Javadoc rozdzielają abstrakcyjny odczyt kosztu od liniowych wierszy, sumę d(v)^2, wpisy kolejki P, powtórne rozwinięcia X(v), callbacki oraz koszt wyniku. Przykład węzła z 10 000 sąsiadów pokazuje około 50 mln porównań. Nie zmieniano lookupu i nie zgłaszano pomiarów wydajności. Szczegóły i polecenia: [VERIFICATION.md](VERIFICATION.md).

**Powiązania:** [NAV-001](../Ashnav/ISSUES.md#nav-001) i [NAV-006](../Ashnav/ISSUES.md#nav-006); zmiana publicznego sposobu odczytu krawędzi wymaga [NAV-007](../Ashnav/ISSUES.md#nav-007).

<a id="nav-006"></a>

## NAV-006 — Doprecyzować duplikaty krawędzi i dane wpływające na wynik

**Status:** GOTOWE<br>
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 4.1, 4.2, 4.5

**Gdzie:** [IntGraph.java](src/main/java/nsk/nu/ashnav/api/graph/IntGraph.java), [WeightedIntGraph.java](src/main/java/nsk/nu/ashnav/api/graph/WeightedIntGraph.java), [WeightedAdjacencyIntGraph.java](src/main/java/nsk/nu/ashnav/implementation/graph/WeightedAdjacencyIntGraph.java), [PathAlgorithmsSupport.java](src/main/java/nsk/nu/ashnav/implementation/path/PathAlgorithmsSupport.java), [WeightedAdjacencyIntGraphTest.java](src/test/java/nsk/nu/ashnav/implementation/graph/WeightedAdjacencyIntGraphTest.java).

**Stan podczas przeglądu:** IntGraph już wymaga deterministycznej kolejności sąsiadów. WeightedAdjacencyIntGraph kopiuje wiersze bez odrzucania powtórzonego sąsiada, a edgeCost zwraca koszt pierwszego pasującego wpisu. Dla sąsiadów [1,1] i kosztów [10,1] oba odczyty edgeCost(0,1) zwracają 10. Nie opisano jednoznacznie modelu równoległych krawędzi.

**Znaczenie:** Dane mogą wyglądać jak dwie drogi do tego samego punktu, a tańsza zostanie niewykorzystana, jeśli API identyfikuje krawędź tylko parą węzłów.

**Praca do wykonania:** Zdecyduj, czy duplikaty są zabronione, łączone według jawnej reguły, czy wymagają osobnego modelu krawędzi. Udokumentuj stałość graph/callback/heuristic w czasie query oraz zakres remisów. Nie deklaruj leksykograficznie najmniejszej całej ścieżki na podstawie samego wyboru mniejszego rodzica.

**Warunki zamknięcia:**

- [x] Przypadek [1,1]/[10,1] i odwrócona kolejność kosztów mają test oraz udokumentowane zachowanie.
- [x] Testy zerowych kosztów, pętli własnych, równych tras i zmian kolejności wejścia sprawdzają tylko rzeczywiście przyjęte gwarancje.
- [x] API wyjaśnia stan i kolejność będące wejściem, zachowanie sumy kosztów poza zakresem double oraz własność przekazanych tablic.

**Realizacja 2026-09-10:** Zachowano i jawnie opisano pierwszy koszt dla powtórzonego (from,to), wraz z kolejnością emisji; testowane są [10,1] i [1,10]. Sprawdzono kopie tablic, zerowe koszty, pętle, remisy, zmianę kolejności wejścia i przepełnienie sum. Dokumentacja oddziela gwarancje poszczególnych solverów od leksykograficznego minimum całej trasy. Szczegóły i polecenia: [VERIFICATION.md](VERIFICATION.md).

**Powiązania:** [NAV-001](../Ashnav/ISSUES.md#nav-001), [NAV-005](../Ashnav/ISSUES.md#nav-005) i [NAV-007](../Ashnav/ISSUES.md#nav-007).

<a id="nav-007"></a>

## NAV-007 — Zdefiniować API stabilne dla użytkownika i odświeżyć README

**Status:** GOTOWE<br>
**Priorytet:** P1  
**Dowód:** DECYZJA  
**Kontrakt:** sekcje 5, 5.1, 8

**Gdzie:** [README.md](README.md), [IntArrayGrid3i.java](src/main/java/nsk/nu/ashnav/implementation/grid/IntArrayGrid3i.java), [GridWalkabilityGraph3.java](src/main/java/nsk/nu/ashnav/implementation/grid/GridWalkabilityGraph3.java), [SpaceMappedGridNavigator3.java](src/main/java/nsk/nu/ashnav/implementation/grid/SpaceMappedGridNavigator3.java), [BfsPathfinder.java](src/main/java/nsk/nu/ashnav/implementation/path/BfsPathfinder.java).

**Stan podczas przeglądu:** Quick start bezpośrednio używa publicznych konstruktorów z implementation; nazwa pakietu nie czyni ich niewspieranymi. POM deklaruje 1.0.0, ale sam numer nie potwierdza publikacji ani zakresu zgodności.

**Znaczenie:** Migracja powinna dać użytkownikowi przewidywalną ścieżkę aktualizacji zamiast wymuszać zgadywanie nowych klas i znaczenia wyników.

**Praca do wykonania:** Opisz wspierane typy, ewentualne fasady/deprecations i skutki [NAV-001](../Ashnav/ISSUES.md#nav-001)–[NAV-006](../Ashnav/ISSUES.md#nav-006). Wyjaśnij początkującemu graph, koszt, heurystykę, snapshot i przechodniość. Zachowaj przykład łatwy do uruchomienia i dodaj warunki poprawności, bez przenoszenia backlogu do instrukcji użycia.

**Warunki zamknięcia:**

- [x] Quick start kompiluje się na docelowym zestawie zależności i świadomie wybiera BFS lub algorytm kosztowy.
- [x] Kontrakty i README są zgodne, a zmiany zachowania mają ocenę wersjonowania/migracji.
- [x] Nie nadpisano opublikowanej wersji i nie usunięto publicznych konstruktorów wyłącznie z powodu ich pakietu.

**Realizacja 2026-09-10:** README określa wspierane publiczne klasy i konstruktory także w implementation oraz migrację do 2.0.0-SNAPSHOT. Test pakietowy kompiluje i wykonuje pełny quick start. Porównanie javap wykazało zero usuniętych publicznych sygnatur; dawny przykład skompilowany z 1.0.0 uruchomiono z nowym JAR-em. Nie publikowano i nie nadpisywano wydań. Szczegóły i polecenia: [VERIFICATION.md](VERIFICATION.md).

**Powiązania:** [CORE-006](../Ashcore/ISSUES.md#core-006), [GRID-006](../Ashgrid/ISSUES.md#grid-006), [SPACE-005](../Ashspace/ISSUES.md#space-005); bieżące zadania algorytmiczne można rozpocząć bez czekania na Ashtrace.

<a id="nav-008"></a>

## NAV-008 — Dostosować CI, pakowanie i dowody wydania

**Status:** GOTOWE<br>
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 2, 4.5, 6

**Gdzie:** [pom.xml](pom.xml), [.github/workflows/maven.yml](.github/workflows/maven.yml), [.github/workflows/publish.yml](.github/workflows/publish.yml), [README.md](README.md).

**Stan podczas przeglądu:** CI uruchamia mvn -B package, a kontrakt wymaga clean verify. POM ustawia source/target 21 bez jawnego przypięcia maven-compiler-plugin; Javadoc ma doclint=none i failOnError=false. Profil central istnieje, lecz pokazany workflow deploy nie aktywuje go i publikuje do GitHub Packages. Repozytorium pochodzi z master; przed obecną gałęzią roboczą istniała review/blackframe-instructions-20260909. CI filtruje master.

**Znaczenie:** Zielony wynik obecnego CI nie jest dowodem wykonania całej bramki jakości ani obecności artefaktu w Maven Central. Brak automatyzacji Central nie dowodzi braku publikacji ręcznej.

**Praca do wykonania:** Ustaw rzeczywistą bramkę clean verify, dobierz przypięty compiler plugin i release 21, sprawdź generowanie dokumentacji oraz jednoznaczną identyfikację artefaktów. Potwierdź utrzymywane gałęzie, docelowe wersje zależności i sposób publikacji do każdej używanej destynacji. JUnit pozostaw w test scope; nie usuwaj go w imię niezależności produkcyjnej.

**Warunki zamknięcia:**

- [x] Zapisano wynik mvn -B clean verify z wymaganymi testami oraz wersje JDK/Maven; CI obejmuje faktycznie utrzymywane gałęzie i PR-y.
- [x] Główny JAR, sources, Javadoc i wymagane zasoby są sprawdzone. Błędny Javadoc nie jest po cichu uznawany za poprawny; nie trzeba przy tym mechanicznie włączać każdej reguły stylistycznej doclint.
- [x] Wskazano używane cele publikacji, tag/wersję i dowody dostępności albo jawnie pozostawiono publikację jako niezweryfikowaną. Sam deploy nie służy jako test poprawek.
- [x] Sprawdzono efektywne zależności i ich scope; test integracyjny korzysta z zamierzonej wersji dolnej warstwy, a nie przypadkowej starej kopii z lokalnego Maven.

**Realizacja 2026-09-10:** clean verify przeszło na JDK 21.0.12.1 i Maven 3.9.9: 45 testów + 2 testy artefaktów. Przypięto kompilator/release 21 i narzędzia; Javadoc nie ukrywa błędów. Sprawdzono JAR, sources, Javadoc, notices, class version 65, przykład i scope zależności. CI obejmuje wszystkie gałęzie i PR-y; zdalny HEAD potwierdza master. actionlint przeszedł. Dokładne zależności, integracja snapshotów i niezweryfikowany stan publikacji są zapisane w VERIFICATION.md. Szczegóły i polecenia: [VERIFICATION.md](VERIFICATION.md).

**Powiązania:** Wspólny wzorzec: [TEMPLATE-001](../Ashtemplate/ISSUES.md#template-001) i [TEMPLATE-002](../Ashtemplate/ISSUES.md#template-002). Tę korektę można wykonać niezależnie od napraw algorytmów. Istniejącego numeru wydania nie nadpisuj innym artefaktem.

<a id="nav-009"></a>

## NAV-009 — Dodać wznawiane i anulowane wyszukiwanie

**Status:** GOTOWE<br>
**Priorytet:** P2<br>
**Dowód:** DECYZJA<br>
**Kontrakt:** sekcje 3.6, 4.2, 4.4, 4.5

**Powód i zakres:** Po zamknięciu NAV-001–NAV-008 użytkownik zatwierdził uzupełnienia wynikające z oceny kompletności Ashnav. Blokujące findPath nie pozwalało rozłożyć pracy na kolejne wywołania ani zrezygnować z zapytania. Kontrola wyszukiwania należy do nawigacji; nie wymaga schedulera ani zależności od silnika gry.

**Realizacja 2026-09-10:** Dodano ResumablePathfinder, PathSearchSession i osobne stany sesji. BFS, Dijkstra i A* używają tego samego silnika w findPath i startSearch. advance ogranicza liczbę zdjęć z kolejki, także nieaktualnych wpisów. Wyczerpanie budżetu pozostawia IN_PROGRESS. cancel między krokami ustawia CANCELLED; błąd callbacku ustawia FAILED i jest ponownie rzucany. Wynik istnieje tylko dla FOUND/UNREACHABLE. Nie zmieniono PathStatus ani dotychczasowych reguł remisów.

**Warunki zamknięcia:**

- [x] Podział pracy na różne budżety daje ten sam pełny wynik co findPath; sprawdzono również wszystkie pary węzłów w 80 małych grafach z wzorcem Floyd–Warshalla.
- [x] Testy rozróżniają pauzę, brak drogi, anulowanie i błąd; obejmują stare wpisy kolejki, ponowne otwieranie A*, niezależne sesje, budżet zero/ujemny i wywołania rekurencyjne.
- [x] README i Javadoc podają ograniczenia: jeden wątek, stabilne dane przez całą sesję, atomowy wiersz sąsiadów, inicjalizacja O(V), odtwarzanie wyniku poza budżetem i zwolnienie pamięci po porzuceniu sesji. Budżet nie oznacza limitu czasu ani pamięci.

**Dowody:** PathSearchSessionTest, PathfinderContractsTest oraz [VERIFICATION.md](VERIFICATION.md#navigation-extensions). Powiązania: NAV-001, NAV-005, NAV-011.

<a id="nav-010"></a>

## NAV-010 — Rozdzielić politykę ruchu i kosztów od mapowania siatki

**Status:** GOTOWE<br>
**Priorytet:** P2<br>
**Dowód:** DECYZJA<br>
**Kontrakt:** sekcje 3.6, 4.1, 4.2, 5.1

**Powód i zakres:** Własny graf mógł modelować reguły klienta, ale navigator wymagał konkretnego GridWalkabilityGraph3. Potrzebna była kompozycja ogólnych reguł przejścia i kosztów z istniejącym mapowaniem komórek, bez wbudowywania fizyki lub reguł gry.

**Realizacja 2026-09-10:** GridNodeMapping3 opisuje mapowanie niezależnie od grafu. PolicyWeightedIntGraph filtruje skierowane krawędzie przez IntEdgePredicate i przelicza ich koszty przez IntEdgeCost, zachowując ID, kolejność i duplikaty. Navigator przyjmuje osobno IntGraph i mapowanie; stary konstruktor pozostaje. Tożsamość solvera sprawdzana jest względem skonfigurowanego grafu przejść. Zgodność liczby węzłów jest walidowana, zgodność znaczenia ID pozostaje obowiązkiem klienta. Polityki są widokiem aktualnych danych i muszą być stabilne podczas zapytania/sesji.

**Warunki zamknięcia:**

- [x] Testy obejmują kosztowną komórkę i objazd, przejście jednokierunkowe oraz przykładową politykę zakazującą przekątnej między blokadami.
- [x] Działa mapowanie, które samo nie jest grafem; błędne liczby węzłów i obcy graf solvera są odrzucane.
- [x] BFS nie wywołuje polityki kosztu; odfiltrowana krawędź również jej nie wywołuje. Koszt wynikowy musi być skończony i nieujemny.
- [x] Pełny przykład README łączy politykę, mapowanie, ramy i sesję; jest kompilowany i wykonywany z zapakowanymi JAR-ami.

**Dowody:** PolicyGraphIntegrationTest, PackagedArtifactIT oraz [VERIFICATION.md](VERIFICATION.md#navigation-extensions). Powiązania: NAV-002, NAV-003, NAV-009, NAV-012.

<a id="nav-011"></a>

## NAV-011 — Usprawnić iterację ważonych krawędzi i zmierzyć zmianę

**Status:** GOTOWE<br>
**Priorytet:** P2<br>
**Dowód:** INSPEKCJA<br>
**Kontrakt:** sekcje 4.1, 4.4, 4.5

**Powód i zakres:** NAV-005 opisał koszt wielokrotnego liniowego wyszukiwania edgeCost, ale nie zmieniał implementacji. Uzupełnienie ma usunąć go z wbudowanej iteracji bez zmiany semantyki duplikatów i istniejących implementacji klienta.

**Realizacja 2026-09-10:** WeightedIntGraph ma domyślne forEachEdge i IntWeightedEdgeConsumer. Graf tablicowy i projekcja siatki przekazują sąsiada z kosztem bez dodatkowego lookupu; Dijkstra/A* korzystają z tego wejścia. Konstruktor grafu tablicowego normalizuje koszty kolejnych duplikatów do pierwszego, po walidacji wszystkich oryginalnych wartości. Liczba i kolejność emisji zostają zachowane. Bezpośrednie edgeCost nadal ma koszt liniowy.

**Warunki zamknięcia:**

- [x] Testy sprawdzają zgodność obu sposobów iteracji, duplikaty w obu kolejnościach kosztów, niepoprawny późniejszy koszt oraz wszystkie N6/N18/N26 na małej siatce.
- [x] Domyślna metoda obsługuje stary interfejs; wcześniej skompilowana implementacja WeightedIntGraph działa z nowym JAR-em. Publiczne sygnatury nie zostały usunięte.
- [x] Wykonano ten sam program pomiarowy przeciwko JAR-owi sprzed zmian i nowemu, na grafie o dużym stopniu, łańcuchu i siatce. Warunki, wyniki oraz ograniczenia zapisano w [BENCHMARKS.md](BENCHMARKS.md).
- [x] Wstępna regresja narzutu sesji została odtworzona i usunięta; końcowy pomiar pokazuje niższy czas oraz mniej alokacji we wszystkich sześciu badanych kombinacjach. Nie jest to gwarancja wydajności dla dowolnego obciążenia.

**Dowody:** WeightedEdgeIterationTest, porównanie binarne, benchmark oraz [VERIFICATION.md](VERIFICATION.md#navigation-extensions). Powiązania: NAV-005, NAV-006, NAV-009.

<a id="nav-012"></a>

## NAV-012 — Powiązać nawigację z lokalnymi układami Ashspace

**Status:** GOTOWE<br>
**Priorytet:** P2<br>
**Dowód:** DECYZJA<br>
**Kontrakt:** sekcje 3.6, 4.2, 4.3, 4.5

**Powód i zakres:** Sam most world→node nie obsługiwał siatki związanej z lokalnym układem ani końców trasy wyrażonych w różnych ramach. Transformacje pozostają własnością Ashspace; Ashnav ma tylko wiązać je z mapowaniem i wyszukiwaniem.

**Realizacja 2026-09-10:** FrameMappedGridNavigator3 przechwytuje przez API Ashspace transformacje wszystkich zdefiniowanych ram do układu siatki i odwrotnie. Obsługuje punkty lokalne/światowe, środki węzłów i końce trasy w różnych ramach, także z grafem polityki. Origin i cellSize mappera są wyrażone w układzie siatki. Koszty nie zmieniają jednostek. Późniejsze zmiany/usunięcia ram nie zmieniają navigatora; odświeżenie wymaga nowej instancji, nowe ID są nieznane.

**Warunki zamknięcia:**

- [x] Integracja obejmuje translację, obrót, niejednostkową komórkę, różne ramy końców, objazd po zmianie kosztów i granice mapy.
- [x] Testy potwierdzają stabilność przechwyconych transformacji po edycji ram oraz odświeżenie nową instancją; błędy ram i współrzędnych są rozdzielone od punktu bez węzła.
- [x] README/Javadoc opisują przechwycenie O(F*h), pamięć O(F), stabilność ram podczas konstrukcji i ograniczenia numeryczne wybranego Ashspace. Nie dodano własnej algebry transformacji ani obietnicy dokładnego round-trip.
- [x] Pełne clean verify przechodzi zarówno z zależnościami wydanymi z POM, jak i ze zidentyfikowanymi lokalnymi snapshotami dolnych warstw, bez ich modyfikacji.

**Dowody:** FrameMappedGridNavigator3IntegrationTest, PackagedArtifactIT oraz [VERIFICATION.md](VERIFICATION.md#navigation-extensions). Powiązania: NAV-003, NAV-010, SPACE-001, SPACE-003.

## Stan przekazania i dziennik sesji

**Historia na 2026-09-09:** wszystkie zadania pozostawały OTWARTE. Utworzono dokumentację; nie wprowadzono korekt kodu, nie wykonano buildów bibliotek ani publikacji. Nie uznawaj samego dodania ISSUES.md za realizację żadnego zadania.

**Historyczny sugerowany start:** [NAV-001](../Ashnav/ISSUES.md#nav-001); następnie [NAV-002](../Ashnav/ISSUES.md#nav-002), [NAV-003](../Ashnav/ISSUES.md#nav-003) i [NAV-004](../Ashnav/ISSUES.md#nav-004).

Po kolejnej sesji dopisz wiersz i uzupełnij statusy odpowiednich zadań. Zapisz także nieudane próby i ograniczenia środowiska; nie opisuj kontroli niewykonanej jako zaliczonej.

| Data / commit | ID i decyzja | Zmiana | Polecenie / test i rzeczywisty wynik | Pozostałe zależności / następny krok |
| --- | --- | --- | --- | --- |
| 2026-09-09 / punkt odniesienia powyżej | Wszystkie: OTWARTE | Utworzenie planu korekt | Inspekcja statyczna; testów bibliotek nie uruchomiono | Rozpocząć od wskazanego P1 |
| 2026-09-10 / snapshot 5dd3d84; commit korekt zawiera ten wpis | NAV-001–NAV-008: GOTOWE | Korekty algorytmu, walidacji, API, dokumentacji i builda wyłącznie w Ashnav | 29 testów bazowych PASS; nowe regresje: 2 FAIL przed poprawką; po poprawkach 45 + 2 PASS w clean verify, także z nowszymi snapshotami; actionlint PASS; zgodność publicznych sygnatur PASS | Brak publikacji, tagu i zdalnego uruchomienia CI; procedura i ograniczenia w VERIFICATION.md |
| 2026-09-10 / snapshot 7d3f046; commit uzupełnień zawiera ten wpis | NAV-009–NAV-012: GOTOWE | Sesje, polityki grafu, ważona iteracja i lokalne ramy; wyłącznie Ashnav | 61 + 2 PASS z zależnościami z POM i snapshotami; dwa przykłady README PASS; 0 usuniętych publicznych sygnatur; stary skompilowany graf klienta PASS; pomiar w BENCHMARKS.md | Te same granice publikacji; sesje mają budżet zdjęć z kolejki, a ramy są przechwytywane przy konstrukcji |

**Stan bieżący:** NAV-001–NAV-012 zamknięte z dowodami lokalnej weryfikacji. Następny krok wydawniczy: wybrać docelowy zestaw wersji, uruchomić CI na commicie wydania i wykonać osobno autoryzowaną publikację. To nie jest zaległa korekta kodu w tych zadaniach.
