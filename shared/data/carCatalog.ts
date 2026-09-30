/**
 * Starting catalogue of brands and their models/types, compiled by hand.
 * Not exhaustive: colleagues can add missing brands and types while creating a project,
 * and those are stored in Firestore and shared (see server/utils/catalog.ts).
 */
export const CAR_CATALOG: Record<string, string[]> = {
  'Rolls-Royce': [
    '20 HP', '20/25', '25/30', '40/50 Silver Ghost', 'Phantom I', 'Phantom II', 'Phantom III', 'Phantom IV', 'Phantom V', 'Phantom VI',
    'Wraith (1938)', 'Silver Wraith', 'Silver Dawn', 'Silver Cloud I', 'Silver Cloud II', 'Silver Cloud III', 'Silver Shadow', 'Silver Shadow II',
    'Silver Spirit', 'Silver Spur', 'Corniche', 'Camargue', 'Silver Seraph', 'Corniche V', 'Phantom VII', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Phantom VIII', 'Spectre'
  ],
  'Ferrari': [
    '166 Inter', '195 Inter', '212 Inter', '250 GT', '250 GT Berlinetta SWB', '250 GT California', '250 GTO', '250 Testa Rossa', '275 GTB', '275 GTS',
    '330 GT 2+2', '330 GTC', '365 GTB/4 Daytona', '365 GTC/4', '365 GT4 2+2', '400 GT', '400i', '412', 'Dino 206 GT', 'Dino 246 GT', 'Dino 308 GT4',
    '308 GTB/GTS', '328', '348', 'F355', '360 Modena', 'F430', '512 BB', 'Testarossa', '512 TR', 'F512 M', 'Mondial', '456 GT', '550 Maranello', '575M Maranello',
    '599 GTB Fiorano', 'F40', 'F50', 'Enzo', 'LaFerrari', 'California', '458 Italia', '488 GTB', 'F8 Tributo', '812 Superfast', 'Roma', 'Portofino', 'SF90 Stradale', '296 GTB', 'Purosangue'
  ],
  'Aston Martin': [
    '2-Litre Sports (DB1)', 'DB2', 'DB2/4', 'DB3', 'DB3S', 'DB Mark III', 'DB4', 'DB4 GT', 'DB4 GT Zagato', 'DB5', 'DB6', 'DBS', 'V8', 'V8 Vantage', 'Lagonda',
    'Virage', 'Vantage (V550)', 'DB7', 'Vanquish', 'DB9', 'V8 Vantage (2005)', 'DBS V12', 'Rapide', 'One-77', 'Vulcan', 'DB11', 'Vantage (2018)', 'DBS Superleggera', 'DBX', 'Valkyrie', 'Valhalla'
  ],
  'Delahaye': ['134', '135', '135M', '135MS', '138', '145', '148', '165', '175', '178', '180', '235'],
  'Lotus': [
    'Mark VI', 'Eleven', 'Seven', 'Elite (1957)', 'Elan', 'Elan +2', 'Cortina', 'Europa', 'Elite (1974)', 'Eclat', 'Esprit', 'Excel', 'Elan (M100)', 'Carlton',
    'Elise', 'Exige', '2-Eleven', 'Evora', 'Evija', 'Emira', 'Eletre', 'Emeya'
  ],
  'Alfa Romeo': [
    '6C 1500', '6C 1750', '6C 1900', '6C 2300', '6C 2500', '8C 2300', '8C 2900', '1900', 'Giulietta Berlina', 'Giulietta Sprint', 'Giulietta Spider', 'Giulia Berlina',
    'Giulia Sprint GT', 'Giulia Spider', 'Giulia TZ', '2000', '2600', 'Spider Duetto', 'Spider 1750', 'Spider 2000', 'Montreal', 'Alfetta', 'Alfasud', 'Alfasud Sprint',
    'GTV', 'GTV6', '33', '75', '164', 'SZ', 'RZ', '155', '145', '146', 'Spider (916)', 'GTV (916)', '156', '166', '147', 'GT', 'Brera', '159', '8C Competizione', 'MiTo', 'Giulietta', '4C', 'Giulia', 'Stelvio', 'Tonale'
  ],
  'Mercedes-Benz': [
    '170 V', '170 S', '220 (W187)', '300 (W186) Adenauer', '300 SL Gullwing (W198)', '300 SL Roadster', '180 Ponton', '190 Ponton', '220 Ponton', '220 S/SE Ponton', '190 SL (W121)',
    '220 SE Coupé/Cabriolet', '300 SE (W112)', '220 Heckflosse (W111)', '230 SL Pagoda (W113)', '250 SL', '280 SL (W113)', '600 (W100)', '250 (W108)', '280 SE (W108)', '280 SE 3.5 Coupé (W111)',
    '280 SEL (W108)', '300 SEL 6.3 (W109)', 'W114/W115 (/8)', '280 (W114)', '350 SL (R107)', '450 SL (R107)', '280 SL (R107)', '380 SL (R107)', '500 SL (R107)', '560 SL (R107)', 'SLC (C107)',
    '450 SEL 6.9 (W116)', '280 S (W116)', 'W123 (200-300)', '280 CE (C123)', '300 D (W123)', 'G-Klasse (W460)', 'G-Klasse (W463)', 'S-Klasse (W126)', '560 SEC (C126)', '190 E (W201)', '190 E 2.3-16', '190 E 2.5-16 Evo',
    'E-Klasse (W124)', '500 E (W124)', 'SL (R129)', 'S-Klasse (W140)', 'CLK (C208)', 'SLK (R170)', 'SL (R230)', 'SLR McLaren'
  ],
  'Lamborghini': [
    '350 GT', '400 GT', 'Miura', 'Miura S', 'Miura SV', 'Islero', 'Espada', 'Jarama', 'Urraco', 'Countach', 'Silhouette', 'Jalpa', 'LM002', 'Diablo', 'Murciélago', 'Gallardo',
    'Reventón', 'Aventador', 'Huracán', 'Urus', 'Sián', 'Revuelto', 'Temerario'
  ],
  'Bugatti': [
    'Type 13', 'Type 30', 'Type 35', 'Type 37', 'Type 38', 'Type 40', 'Type 41 Royale', 'Type 43', 'Type 44', 'Type 46', 'Type 49', 'Type 50', 'Type 51', 'Type 55', 'Type 57', 'Type 57S',
    'Type 57SC Atlantic', 'Type 59', 'Type 101', 'EB110', 'Veyron', 'Chiron', 'Divo', 'Centodieci', 'Mistral', 'Tourbillon'
  ],
  'Jaguar': [
    'SS 100', 'XK120', 'XK140', 'XK150', 'C-Type', 'D-Type', 'XKSS', 'Mark V', 'Mark VII', 'Mark VIII', 'Mark IX', 'Mark X', '420G', '2.4 Litre (Mark 1)', '3.4 Litre', 'Mark 2', 'S-Type', '420',
    'E-Type Series 1', 'E-Type Series 1½', 'E-Type Series 2', 'E-Type Series 3', 'XJ6 Series 1', 'XJ6 Series 2', 'XJ6 Series 3', 'XJ12', 'XJ-S', 'XJ40', 'XJ (X300)', 'XJ220', 'XJ13', 'XK8', 'XKR',
    'S-Type (1999)', 'X-Type', 'XF', 'XE', 'XJ (X350)', 'F-Type', 'E-Pace', 'F-Pace', 'I-Pace'
  ],
  'Bentley': [
    '3 Litre', '4½ Litre', 'Blower', '6½ Litre', 'Speed Six', '8 Litre', '3½ Litre', '4¼ Litre', 'Mark V', 'R-Type', 'R-Type Continental', 'S1', 'S1 Continental', 'S2', 'S3', 'T-Series', 'Corniche',
    'Camargue', 'Mulsanne', 'Mulsanne Turbo', 'Eight', 'Turbo R', 'Continental R', 'Continental T', 'Azure', 'Arnage', 'Brooklands', 'Continental GT', 'Continental GTC', 'Flying Spur', 'Mulsanne (2010)', 'Bentayga', 'Bacalar'
  ],
  'Porsche': [
    '356', '356 Speedster', '356 A', '356 B', '356 C', '550 Spyder', '904 Carrera GTS', '911 (901)', '911 (F-model)', '911 Carrera RS 2.7', '911 (G-model)', '911 Turbo (930)', '911 SC', '911 Carrera 3.2',
    '911 (964)', '911 (993)', '911 (996)', '911 (997)', '911 (991)', '911 (992)', '912', '914', '914/6', '924', '924 Turbo', '924 Carrera GT', '928', '944', '944 Turbo', '968', '959', '917', '935',
    'Boxster (986)', 'Boxster (987)', 'Cayman (987)', 'Boxster (981)', 'Cayman (981)', '718 Boxster', '718 Cayman', 'Carrera GT', '918 Spyder', 'Cayenne', 'Panamera', 'Macan', 'Taycan'
  ],
  'Maserati': [
    'A6 1500', 'A6G', 'A6G/54', '3500 GT', '5000 GT', 'Sebring', 'Mistral', 'Quattroporte', 'Mexico', 'Ghibli', 'Indy', 'Bora', 'Merak', 'Khamsin', 'Kyalami', 'Biturbo', 'Karif', 'Spyder',
    'Shamal', '222', '228', 'Ghibli II', '3200 GT', 'Coupé', 'GranTurismo', 'GranCabrio', 'MC12', 'Levante', 'Ghibli (2013)', 'Grecale', 'MC20'
  ]
}
