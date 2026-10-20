/** Official IPA AM2 answer keys, used by both exam modes. */
export const am2Years = [
  {label:'2025年度（令和7年・春期）',id:'2025r07h',list:'2025r07',key:'エエイウアアウイアエエエエイアウウエエウエウウエイ'},
  {label:'2024年度（令和6年・春期）',id:'2024r06h',list:'2024r06',key:'エイウエイアアアエアウイウイウエウアウエアアウエイ'},
  {label:'2023年度（令和5年・春期）',id:'2023r05h',list:'2023r05',key:'イイウアアイイアアエアアウウエウアエエイウウエエイ'},
  {label:'2022年度（令和4年・春期）',id:'2022r04h',list:'2022r04',key:'イイエイイイイエウアエイエウイエアイウエイエエイア'},
  {label:'2021年度（令和3年・春期）',id:'2021r03h',list:'2021r03',key:'イイウウウイアアイウイイアエウアアウイエイイウアイ'},
  {label:'2019年度（令和元年・秋期）',id:'2019r01a',list:'2019h31',key:'イウイアウアイアエエウイイアウエエエエアウアウアウ'},
  {label:'2018年度（平成30年・秋期）',id:'2018h30a',list:'2018h30',key:'イエエエアアアウウアエイイエウイウウイエイエアウイ'},
  {label:'2017年度（平成29年・秋期）',id:'2017h29a',list:'2017h29',key:'エウアウイアウイアウウアイイウエエイウエアアウアエ'},
  {label:'2016年度（平成28年・秋期）',id:'2016h28a',list:'2016h28',key:'ウエエウイイアエウイイウエイウエエエエアエエイアア'}
] as const;
export type Am2Year = (typeof am2Years)[number];
export type Am2YearId = Am2Year['id'];
export const AM2_QUESTION_COUNT = 25;
export const AM2_DURATION_MINUTES = 40;
export function findAm2Year(id: string | null | undefined): Am2Year | undefined {
  return am2Years.find(year => year.id === id);
}
if (am2Years.length !== 9 || am2Years.some(year => year.key.length !== AM2_QUESTION_COUNT)) {
  throw new Error('AM2 answer key coverage must be 9 years with 25 answers each');
}
