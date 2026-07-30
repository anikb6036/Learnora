export interface GeoState {
  name: string;
  districts: string[];
  // Standard PIN prefix context for smart simulation or presets
  pinPrefixes?: string[];
  postOffices?: { [pin: string]: string[] };
}

export interface GeoCountry {
  name: string;
  code: string;
  flag: string;
  states: GeoState[];
}

export const GEO_COUNTRIES: GeoCountry[] = [
  {
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    states: [
      {
        name: 'West Bengal',
        districts: ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Hooghly', 'Nadia', 'Murshidabad', 'Darjeeling'],
        postOffices: {
          '700001': ['GPO Kolkata', 'Radhabazar SO', 'Lalbazar SO'],
          '700091': ['Salt Lake Sector V', 'Bidhan Nagar CC Block', 'Sech Bhawan'],
          '700102': ['Kestopur SO', 'Baguiati SO'],
          '700156': ['New Town SO', 'Action Area I SO'],
          '711101': ['Howrah HPO', 'Howrah Maidan SO'],
          '712201': ['Uttarpara SO', 'Hindmotor SO']
        }
      },
      {
        name: 'Maharashtra',
        districts: ['Mumbai City', 'Pune', 'Thane', 'Nagpur', 'Nashik', 'Aurangabad'],
        postOffices: {
          '400001': ['Mumbai GPO', 'Taj Hotel SO', 'Colaba SO'],
          '411001': ['Pune HPO', 'Camp SO', 'Station Road SO'],
          '400601': ['Thane HPO', 'Ram Maruti Road SO']
        }
      },
      {
        name: 'Delhi',
        districts: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
        postOffices: {
          '110001': ['New Delhi GPO', 'Connaught Place SO', 'Parliament House SO'],
          '110011': ['Nirman Bhawan SO', 'Udyog Bhawan SO']
        }
      },
      {
        name: 'Karnataka',
        districts: ['Bengaluru Urban', 'Bengaluru Rural', 'Mysore', 'Mangalore', 'Hubli'],
        postOffices: {
          '560001': ['Bengaluru GPO', 'Rajajinagar SO', 'Vidhana Soudha SO'],
          '560037': ['Marathahalli SO', 'Kundalahalli SO']
        }
      },
      {
        name: 'Tamil Nadu',
        districts: ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'],
        postOffices: {
          '600001': ['Chennai GPO', 'Parrys SO', 'Mannady SO'],
          '600028': ['Raja Annamalaipuram SO', 'Mandaveli SO']
        }
      }
    ]
  },
  {
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    states: [
      {
        name: 'California',
        districts: ['Los Angeles', 'San Diego', 'Orange County', 'Santa Clara', 'San Francisco'],
        postOffices: {
          '90001': ['Los Angeles Main PO', 'Firestone PO'],
          '94102': ['San Francisco Civic Center PO', 'Union Square PO'],
          '95051': ['Santa Clara Central PO', 'Mariposa PO']
        }
      },
      {
        name: 'New York',
        districts: ['New York County', 'Kings County', 'Queens County', 'Bronx', 'Richmond'],
        postOffices: {
          '10001': ['James A. Farley GPO', 'Empire State PO'],
          '11201': ['Brooklyn Heights PO', 'Downtown Brooklyn PO']
        }
      },
      {
        name: 'Texas',
        districts: ['Harris', 'Dallas', 'Tarrant', 'Bexar', 'Travis'],
        postOffices: {
          '77001': ['Houston GPO', 'Downtown Houston PO'],
          '75201': ['Dallas Main PO', 'Arts District PO']
        }
      }
    ]
  },
  {
    name: 'Bangladesh',
    code: 'BD',
    flag: '🇧🇩',
    states: [
      {
        name: 'Dhaka Division',
        districts: ['Dhaka', 'Gazipur', 'Narayanganj', 'Faridpur', 'Gopalganj'],
        postOffices: {
          '1000': ['Dhaka GPO', 'Motijheel SO', 'Ramna SO'],
          '1205': ['New Market SO', 'Dhanmondi SO', 'Elephant Road SO'],
          '1212': ['Gulshan SO', 'Banani SO', 'Badda SO']
        }
      },
      {
        name: 'Chittagong Division',
        districts: ['Chittagong', 'Cox\'s Bazar', 'Comilla', 'Feni', 'Rangamati'],
        postOffices: {
          '4000': ['Chittagong GPO', 'Patenga SO', 'Bandar SO'],
          '4700': ['Cox\'s Bazar Head Office', 'Ramu SO']
        }
      }
    ]
  },
  {
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    states: [
      {
        name: 'Ontario',
        districts: ['Toronto Metro', 'Ottawa Region', 'Peel Region', 'York Region'],
        postOffices: {
          'M5V 1A1': ['Toronto Union Stn PO', 'King Street West PO'],
          'K1P 5A1': ['Ottawa Parliament PO', 'Elgin Street PO']
        }
      },
      {
        name: 'British Columbia',
        districts: ['Greater Vancouver', 'Victoria', 'Kelowna'],
        postOffices: {
          'V6B 3A1': ['Vancouver Main PO', 'Robson Street PO']
        }
      }
    ]
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    flag: '🇬🇧',
    states: [
      {
        name: 'England',
        districts: ['Greater London', 'West Midlands', 'Greater Manchester', 'Merseyside'],
        postOffices: {
          'EC1A 1BB': ['London Mount Pleasant GPO', 'Farringdon PO'],
          'M1 1AA': ['Manchester Piccadilly PO', 'Albert Square PO']
        }
      }
    ]
  }
];

// Fallback search that guesses or creates list options dynamically for non-profiled states
export function getSmartPostOffices(country: string, stateName: string, district: string, pin: string): string[] {
  const cleanPin = pin.trim().toUpperCase();
  const foundCountry = GEO_COUNTRIES.find(c => c.name.toLowerCase() === country.toLowerCase());
  if (foundCountry) {
    const foundState = foundCountry.states.find(s => s.name.toLowerCase() === stateName.toLowerCase());
    if (foundState && foundState.postOffices && foundState.postOffices[cleanPin]) {
      return foundState.postOffices[cleanPin];
    }
  }

  // Generates 3 realistic simulated post offices based on entered PIN / District
  if (!cleanPin) return [];
  const baseName = district ? `${district} Sector` : `${stateName || 'Central'} Zone`;
  return [
    `${baseName} Main Office (${cleanPin})`,
    `${baseName} North Sub-Post Office`,
    `${baseName} Delivery Sub-Office`
  ];
}
