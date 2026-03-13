/**
 * Maps Irish Eircode routing codes (first 3 chars) to their county.
 * Source: An Post / Eircode.ie routing code list.
 */
const ROUTING_TO_COUNTY: Record<string, string> = {
  // Dublin
  D01: 'Dublin', D02: 'Dublin', D03: 'Dublin', D04: 'Dublin',
  D05: 'Dublin', D06: 'Dublin', D07: 'Dublin', D08: 'Dublin',
  D09: 'Dublin', D10: 'Dublin', D11: 'Dublin', D12: 'Dublin',
  D13: 'Dublin', D14: 'Dublin', D15: 'Dublin', D16: 'Dublin',
  D17: 'Dublin', D18: 'Dublin', D20: 'Dublin', D22: 'Dublin', D24: 'Dublin',
  // South Dublin / Dún Laoghaire (A-series)
  A86: 'Dublin', A94: 'Dublin', A96: 'Dublin', A98: 'Dublin',
  // Louth
  A91: 'Louth', A92: 'Louth',
  // Meath
  A41: 'Meath', A42: 'Meath', N37: 'Meath',
  // Wicklow
  A45: 'Wicklow', A63: 'Wicklow', A67: 'Wicklow', A75: 'Wicklow',
  A81: 'Wicklow', A82: 'Wicklow', A83: 'Wicklow', A84: 'Wicklow', A85: 'Wicklow',
  // Carlow
  E41: 'Carlow', E45: 'Carlow',
  // Cavan
  H12: 'Cavan', H14: 'Cavan',
  // Clare
  V94: 'Clare',
  // Cork city
  T12: 'Cork', T23: 'Cork', T34: 'Cork', T45: 'Cork', T56: 'Cork',
  // Cork county
  P12: 'Cork', P14: 'Cork', P17: 'Cork', P24: 'Cork', P25: 'Cork',
  P31: 'Cork', P32: 'Cork', P36: 'Cork', P43: 'Cork', P47: 'Cork',
  P51: 'Cork', P56: 'Cork', P61: 'Cork', P67: 'Cork', P72: 'Cork',
  P75: 'Cork', P81: 'Cork', P85: 'Cork',
  V31: 'Cork', V35: 'Cork', V42: 'Cork',
  // Donegal
  F92: 'Donegal', F93: 'Donegal', F94: 'Donegal',
  H18: 'Donegal', H23: 'Donegal', H53: 'Donegal', H54: 'Donegal',
  // Galway
  H91: 'Galway', F91: 'Galway',
  // Kerry
  V14: 'Kerry', V15: 'Kerry', V23: 'Kerry', V92: 'Kerry', V95: 'Kerry',
  // Kildare
  W12: 'Kildare', W23: 'Kildare', W34: 'Kildare', W91: 'Kildare',
  K32: 'Kildare', K34: 'Kildare', K36: 'Kildare', K45: 'Kildare',
  K56: 'Kildare', K67: 'Kildare',
  // Kilkenny
  E21: 'Kilkenny', E25: 'Kilkenny', E32: 'Kilkenny', E34: 'Kilkenny',
  // Laois
  R32: 'Laois', R35: 'Laois',
  // Leitrim
  F52: 'Leitrim', F56: 'Leitrim',
  // Limerick
  V93: 'Limerick',
  // Longford
  N41: 'Longford',
  // Mayo
  F12: 'Mayo', F23: 'Mayo', F26: 'Mayo', F28: 'Mayo', F31: 'Mayo', F35: 'Mayo',
  // Monaghan
  H16: 'Monaghan',
  // Offaly
  R42: 'Offaly', R45: 'Offaly',
  // Roscommon
  F42: 'Roscommon', H65: 'Roscommon',
  // Sligo
  F45: 'Sligo', H71: 'Sligo',
  // Tipperary
  E91: 'Tipperary', R14: 'Tipperary', R21: 'Tipperary', R95: 'Tipperary',
  // Waterford
  X35: 'Waterford', X42: 'Waterford', X91: 'Waterford',
  // Westmeath
  N39: 'Westmeath', N91: 'Westmeath', R51: 'Westmeath', R56: 'Westmeath',
  // Wexford
  E53: 'Wexford', Y21: 'Wexford', Y25: 'Wexford', Y34: 'Wexford', Y35: 'Wexford',
};

/**
 * Returns the Irish county for a given Eircode (or routing code prefix).
 * Returns null if not recognised.
 */
export function eircodeToCounty(eircode: string): string | null {
  const routing = eircode.replace(/\s+/g, '').slice(0, 3).toUpperCase();
  return ROUTING_TO_COUNTY[routing] ?? null;
}
