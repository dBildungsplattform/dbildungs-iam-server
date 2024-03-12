import { applyDecorators } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

// Regex to validate DIN-91379A for a string
// Generated using the list of legal characters using these steps:
// 1. All single-sequence characters are combined as best as possible.
// 2. All two-sequence characters are grouped by their first codepoint
// 3. All three-sequence characters are kept as is and appended at the end

/**
 * Namen natürlicher Personen
 */
export const DIN_91379A: RegExp =
    /^(\u0020|\u0027|[\u002C-\u002E]|[\u0041-\u005A]|[\u0060-\u007A]|\u007E|\u00A8|\u00B4|\u00B7|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u017E]|[\u0187-\u0188]|\u018F|\u0197|[\u01A0-\u01A1]|[\u01AF-\u01B0]|\u01B7|[\u01CD-\u01DC]|[\u01DE-\u01DF]|[\u01E2-\u01F0]|[\u01F4-\u01F5]|[\u01F8-\u01FF]|[\u0212-\u0213]|[\u0218-\u021B]|[\u021E-\u021F]|[\u0227-\u0233]|\u0259|\u0268|\u0292|[\u02B9-\u02BA]|[\u02BE-\u02BF]|\u02C8|\u02CC|[\u1E02-\u1E03]|[\u1E06-\u1E07]|[\u1E0A-\u1E11]|\u1E17|[\u1E1C-\u1E2B]|[\u1E2F-\u1E37]|[\u1E3A-\u1E3B]|[\u1E40-\u1E49]|[\u1E52-\u1E5B]|[\u1E5E-\u1E63]|[\u1E6A-\u1E6F]|[\u1E80-\u1E87]|[\u1E8C-\u1E97]|\u1E9E|[\u1EA0-\u1EF9]|\u2019|\u2021|\u0041[\u030B\u030B\u030B\u030B]|\u0043[\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326]|\u0044\u0302|\u0046[\u0300\u0304\u0300\u0304]|\u0047\u0300|\u0048[\u0304\u0326\u0331\u0304\u0326\u0331\u0304\u0326\u0331]|\u004A[\u0301\u030C\u0301\u030C]|\u004B[\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326]|\u004C[\u0302\u0325\u0326\u0302\u0325\u0326\u0302\u0325\u0326]|\u004D[\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310]|\u004E[\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326]|\u0050[\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323]|\u0052[\u0306\u0325\u0306\u0325]|\u0053[\u0300\u0304\u0331\u0300\u0304\u0331\u0300\u0304\u0331]|\u0054[\u0300\u0304\u0308\u0315\u031B\u0300\u0304\u0308\u0315\u031B\u0300\u0304\u0308\u0315\u031B\u0300\u0304\u0308\u0315\u031B\u0300\u0304\u0308\u0315\u031B]|\u0055\u0307|\u005A[\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327]|\u0061\u030B|\u0063[\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326]|\u0064\u0302|\u0066[\u0300\u0304\u0300\u0304]|\u0067\u0300|\u0068[\u0304\u0326\u0304\u0326]|\u006A\u0301|\u006B[\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326]|\u006C[\u0302\u0325\u0326\u0302\u0325\u0326\u0302\u0325\u0326]|\u006D[\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310]|\u006E[\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326]|\u0070[\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323]|\u0072[\u0306\u0325\u0306\u0325]|\u0073[\u0300\u0304\u0331\u0300\u0304\u0331\u0300\u0304\u0331]|\u0074[\u0300\u0304\u0315\u031B\u0300\u0304\u0315\u031B\u0300\u0304\u0315\u031B\u0300\u0304\u0315\u031B]|\u0075\u0307|\u007A[\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327]|\u00C7\u0306|\u00DB\u0304|\u00E7\u0306|\u00FB\u0304|\u00FF\u0301|\u010C[\u0315\u0323\u0315\u0323]|\u010D[\u0315\u0323\u0315\u0323]|\u0113\u030D|\u012A\u0301|\u012B\u0301|\u014D\u030D|\u017D[\u0326\u0327\u0326\u0327]|\u017E[\u0326\u0327\u0326\u0327]|\u1E32\u0304|\u1E33\u0304|\u1E62\u0304|\u1E63\u0304|\u1E6C\u0304|\u1E6D\u0304|\u1EA0\u0308|\u1EA1\u0308|\u1ECC\u0308|\u1ECD\u0308|\u1EE4[\u0304\u0308\u0304\u0308]|\u1EE5[\u0304\u0308\u0304\u0308]|\u0043\u0328\u0306|\u004B\u035F\u0048|\u004B\u035F\u0068|\u004C\u0325\u0304|\u0052\u0325\u0304|\u0053\u031B\u0304|\u0063\u0328\u0306|\u006B\u035F\u0068|\u006C\u0325\u0304|\u0072\u0325\u0304|\u0073\u031B\u0304)*$/;

/**
 * Namen natürlicher Personen + '()' & '0-9'
 */
export const DIN_91379A_EXT: RegExp =
    /^(\u0020|[\u0027-\u0029]|[\u002C-\u002E]|[\u0030-\u0039]|[\u0041-\u005A]|[\u0060-\u007A]|\u007E|\u00A8|\u00B4|\u00B7|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u017E]|[\u0187-\u0188]|\u018F|\u0197|[\u01A0-\u01A1]|[\u01AF-\u01B0]|\u01B7|[\u01CD-\u01DC]|[\u01DE-\u01DF]|[\u01E2-\u01F0]|[\u01F4-\u01F5]|[\u01F8-\u01FF]|[\u0212-\u0213]|[\u0218-\u021B]|[\u021E-\u021F]|[\u0227-\u0233]|\u0259|\u0268|\u0292|[\u02B9-\u02BA]|[\u02BE-\u02BF]|\u02C8|\u02CC|[\u1E02-\u1E03]|[\u1E06-\u1E07]|[\u1E0A-\u1E11]|\u1E17|[\u1E1C-\u1E2B]|[\u1E2F-\u1E37]|[\u1E3A-\u1E3B]|[\u1E40-\u1E49]|[\u1E52-\u1E5B]|[\u1E5E-\u1E63]|[\u1E6A-\u1E6F]|[\u1E80-\u1E87]|[\u1E8C-\u1E97]|\u1E9E|[\u1EA0-\u1EF9]|\u2019|\u2021|\u0041[\u030B\u030B\u030B\u030B]|\u0043[\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326]|\u0044\u0302|\u0046[\u0300\u0304\u0300\u0304]|\u0047\u0300|\u0048[\u0304\u0326\u0331\u0304\u0326\u0331\u0304\u0326\u0331]|\u004A[\u0301\u030C\u0301\u030C]|\u004B[\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326]|\u004C[\u0302\u0325\u0326\u0302\u0325\u0326\u0302\u0325\u0326]|\u004D[\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310]|\u004E[\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326]|\u0050[\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323]|\u0052[\u0306\u0325\u0306\u0325]|\u0053[\u0300\u0304\u0331\u0300\u0304\u0331\u0300\u0304\u0331]|\u0054[\u0300\u0304\u0308\u0315\u031B\u0300\u0304\u0308\u0315\u031B\u0300\u0304\u0308\u0315\u031B\u0300\u0304\u0308\u0315\u031B\u0300\u0304\u0308\u0315\u031B]|\u0055\u0307|\u005A[\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327]|\u0061\u030B|\u0063[\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326\u0300\u0304\u0306\u0308\u0315\u0323\u0326]|\u0064\u0302|\u0066[\u0300\u0304\u0300\u0304]|\u0067\u0300|\u0068[\u0304\u0326\u0304\u0326]|\u006A\u0301|\u006B[\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326\u0300\u0302\u0304\u0307\u0315\u031B\u0326]|\u006C[\u0302\u0325\u0326\u0302\u0325\u0326\u0302\u0325\u0326]|\u006D[\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310\u0300\u0302\u0306\u0310]|\u006E[\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326\u0302\u0304\u0306\u0326]|\u0070[\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323\u0300\u0304\u0315\u0323]|\u0072[\u0306\u0325\u0306\u0325]|\u0073[\u0300\u0304\u0331\u0300\u0304\u0331\u0300\u0304\u0331]|\u0074[\u0300\u0304\u0315\u031B\u0300\u0304\u0315\u031B\u0300\u0304\u0315\u031B\u0300\u0304\u0315\u031B]|\u0075\u0307|\u007A[\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327\u0300\u0304\u0306\u0308\u0327]|\u00C7\u0306|\u00DB\u0304|\u00E7\u0306|\u00FB\u0304|\u00FF\u0301|\u010C[\u0315\u0323\u0315\u0323]|\u010D[\u0315\u0323\u0315\u0323]|\u0113\u030D|\u012A\u0301|\u012B\u0301|\u014D\u030D|\u017D[\u0326\u0327\u0326\u0327]|\u017E[\u0326\u0327\u0326\u0327]|\u1E32\u0304|\u1E33\u0304|\u1E62\u0304|\u1E63\u0304|\u1E6C\u0304|\u1E6D\u0304|\u1EA0\u0308|\u1EA1\u0308|\u1ECC\u0308|\u1ECD\u0308|\u1EE4[\u0304\u0308\u0304\u0308]|\u1EE5[\u0304\u0308\u0304\u0308]|\u0043\u0328\u0306|\u004B\u035F\u0048|\u004B\u035F\u0068|\u004C\u0325\u0304|\u0052\u0325\u0304|\u0053\u031B\u0304|\u0063\u0328\u0306|\u006B\u035F\u0068|\u006C\u0325\u0304|\u0072\u0325\u0304|\u0073\u031B\u0304)*$/;

// Mappings of characters to their base character (Searchform) according to DIN-91379
const NORMATIVE_MAPPINGS: { pattern: RegExp; base: string }[] = [
    // [A,A̋,a,a̋,À,Á,Â,Ã,à,á,â,ã,Ā,ā,Ă,ă,Ą,ą,Ǎ,ǎ,ȧ,Ạ,ạ,Ả,ả,Ấ,ấ,Ầ,ầ,Ẩ,ẩ,Ẫ,ẫ,Ậ,ậ,Ắ,ắ,Ằ,ằ,Ẳ,ẳ,Ẵ,ẵ,Ặ,ặ] -> A
    {
        base: 'A',
        pattern: /(A|A̋|a|a̋|À|Á|Â|Ã|à|á|â|ã|Ā|ā|Ă|ă|Ą|ą|Ǎ|ǎ|ȧ|Ạ|ạ|Ả|ả|Ấ|ấ|Ầ|ầ|Ẩ|ẩ|Ẫ|ẫ|Ậ|ậ|Ắ|ắ|Ằ|ằ|Ẳ|ẳ|Ẵ|ẵ|Ặ|ặ)/g,
    },
    // [B,b,Ḃ,ḃ,Ḇ,ḇ] -> B
    { base: 'B', pattern: /[BbḂḃḆḇ]/g },
    // [C,C̀,C̄,C̆,C̈,C̕,C̣,C̦,C̨̆,c,c̀,c̄,c̆,c̈,c̕,c̣,c̦,c̨̆,Ç,Ç̆,ç,ç̆,Ć,ć,Ĉ,ĉ,Ċ,ċ,Č,Č̕,Č̣,č,č̕,č̣,Ƈ,ƈ] -> C
    { base: 'C', pattern: /(C|C̀|C̄|C̆|C̈|C̕|C̣|C̦|C̨̆|c|c̀|c̄|c̆|c̈|c̕|c̣|c̦|c̨̆|Ç|Ç̆|ç|ç̆|Ć|ć|Ĉ|ĉ|Ċ|ċ|Č|Č̕|Č̣|č|č̕|č̣|Ƈ|ƈ)/g },
    // [D,D̂,d,d̂,Ð,ð,Ď,ď,Đ,đ,Ḋ,ḋ,Ḍ,ḍ,Ḏ,ḏ,Ḑ,ḑ] -> D
    { base: 'D', pattern: /(D|D̂|d|d̂|Ð|ð|Ď|ď|Đ|đ|Ḋ|ḋ|Ḍ|ḍ|Ḏ|ḏ|Ḑ|ḑ)/g },
    // [E,e,È,É,Ê,Ë,è,é,ê,ë,Ē,ē,ē̍,Ĕ,ĕ,Ė,ė,Ę,ę,Ě,ě,Ə,Ȩ,ȩ,ə,ḗ,Ḝ,ḝ,Ẹ,ẹ,Ẻ,ẻ,Ẽ,ẽ,Ế,ế,Ề,ề,Ể,ể,Ễ,ễ,Ệ,ệ] -> E
    {
        base: 'E',
        pattern: /(E|e|È|É|Ê|Ë|è|é|ê|ë|Ē|ē|ē̍|Ĕ|ĕ|Ė|ė|Ę|ę|Ě|ě|Ə|Ȩ|ȩ|ə|ḗ|Ḝ|ḝ|Ẹ|ẹ|Ẻ|ẻ|Ẽ|ẽ|Ế|ế|Ề|ề|Ể|ể|Ễ|ễ|Ệ|ệ)/g,
    },
    // [F,F̀,F̄,f,f̀,f̄,Ḟ,ḟ] -> F
    { base: 'F', pattern: /(F|F̀|F̄|f|f̀|f̄|Ḟ|ḟ)/g },
    // [G,G̀,g,g̀,Ĝ,ĝ,Ğ,ğ,Ġ,ġ,Ģ,ģ,Ǥ,ǥ,Ǧ,ǧ,Ǵ,ǵ,Ḡ,ḡ] -> G
    { base: 'G', pattern: /(G|G̀|g|g̀|Ĝ|ĝ|Ğ|ğ|Ġ|ġ|Ģ|ģ|Ǥ|ǥ|Ǧ|ǧ|Ǵ|ǵ|Ḡ|ḡ)/g },
    // [H,H̄,H̦,H̱,h,h̄,h̦,Ĥ,ĥ,Ħ,ħ,Ȟ,ȟ,Ḣ,ḣ,Ḥ,ḥ,Ḧ,ḧ,Ḩ,ḩ,Ḫ,ḫ,ẖ] -> H
    { base: 'H', pattern: /(H|H̄|H̦|H̱|h|h̄|h̦|Ĥ|ĥ|Ħ|ħ|Ȟ|ȟ|Ḣ|ḣ|Ḥ|ḥ|Ḧ|ḧ|Ḩ|ḩ|Ḫ|ḫ|ẖ)/g },
    // [I,i,Ì,Í,Î,Ï,ì,í,î,ï,Ĩ,ĩ,Ī,Ī́,ī,ī́,Ĭ,ĭ,Į,į,İ,ı,Ɨ,Ǐ,ǐ,ɨ,ḯ,Ỉ,ỉ,Ị,ị] -> I
    { base: 'I', pattern: /(I|i|Ì|Í|Î|Ï|ì|í|î|ï|Ĩ|ĩ|Ī|Ī́|ī|ī́|Ĭ|ĭ|Į|į|İ|ı|Ɨ|Ǐ|ǐ|ɨ|ḯ|Ỉ|ỉ|Ị|ị)/g },
    // [J,J́,J̌,j,j́,Ĵ,ĵ,ǰ] -> J
    { base: 'J', pattern: /(J|J́|J̌|j|j́|Ĵ|ĵ|ǰ)/g },
    // [K,K̀,K̂,K̄,K̇,K̕,K̛,K̦,k,k̀,k̂,k̄,k̇,k̕,k̛,k̦,Ķ,ķ,ĸ,Ǩ,ǩ,Ḱ,ḱ,Ḳ,Ḳ̄,ḳ,ḳ̄,Ḵ,ḵ] -> K
    { base: 'K', pattern: /(K|K̀|K̂|K̄|K̇|K̕|K̛|K̦|k|k̀|k̂|k̄|k̇|k̕|k̛|k̦|Ķ|ķ|ĸ|Ǩ|ǩ|Ḱ|ḱ|Ḳ|Ḳ̄|ḳ|ḳ̄|Ḵ|ḵ)/g },
    // [K͟H,K͟h,k͟h] -> KH
    { base: 'KH', pattern: /(K͟H|K͟h|k͟h)/g },
    // [L,L̂,L̥,L̥̄,L̦,l,l̂,l̥,l̥̄,l̦,Ĺ,ĺ,Ļ,ļ,Ľ,ľ,Ŀ,ŀ,Ł,ł,Ḷ,ḷ,Ḻ,ḻ] -> L
    { base: 'L', pattern: /(L|L̂|L̥|L̥̄|L̦|l|l̂|l̥|l̥̄|l̦|Ĺ|ĺ|Ļ|ļ|Ľ|ľ|Ŀ|ŀ|Ł|ł|Ḷ|ḷ|Ḻ|ḻ)/g },
    // [M,M̀,M̂,M̆,M̐,m,m̀,m̂,m̆,m̐,Ṁ,ṁ,Ṃ,ṃ] -> M
    { base: 'M', pattern: /(M|M̀|M̂|M̆|M̐|m|m̀|m̂|m̆|m̐|Ṁ|ṁ|Ṃ|ṃ)/g },
    // [N,N̂,N̄,N̆,N̦,n,n̂,n̄,n̆,n̦,Ñ,ñ,Ń,ń,Ņ,ņ,Ň,ň,ŉ,Ŋ,ŋ,Ǹ,ǹ,Ṅ,ṅ,Ṇ,ṇ,Ṉ,ṉ] -> N
    { base: 'N', pattern: /(N|N̂|N̄|N̆|N̦|n|n̂|n̄|n̆|n̦|Ñ|ñ|Ń|ń|Ņ|ņ|Ň|ň|ŉ|Ŋ|ŋ|Ǹ|ǹ|Ṅ|ṅ|Ṇ|ṇ|Ṉ|ṉ)/g },
    // [O,o,Ò,Ó,Ô,Õ,ò,ó,ô,õ,Ō,ō,ō̍,Ŏ,ŏ,Ő,ő,Ơ,ơ,Ǒ,ǒ,Ǫ,ǫ,Ǭ,ǭ,Ȭ,ȭ,Ȯ,ȯ,Ȱ,ȱ,Ṓ,ṓ,Ọ,ọ,Ỏ,ỏ,Ố,ố,Ồ,ồ,Ổ,ổ,Ỗ,ỗ,Ộ,ộ,Ớ,ớ,Ờ,ờ,Ở,ở,Ỡ,ỡ,Ợ,ợ] -> O
    {
        base: 'O',
        pattern:
            /(O|o|Ò|Ó|Ô|Õ|ò|ó|ô|õ|Ō|ō|ō̍|Ŏ|ŏ|Ő|ő|Ơ|ơ|Ǒ|ǒ|Ǫ|ǫ|Ǭ|ǭ|Ȭ|ȭ|Ȯ|ȯ|Ȱ|ȱ|Ṓ|ṓ|Ọ|ọ|Ỏ|ỏ|Ố|ố|Ồ|ồ|Ổ|ổ|Ỗ|ỗ|Ộ|ộ|Ớ|ớ|Ờ|ờ|Ở|ở|Ỡ|ỡ|Ợ|ợ)/g,
    },
    // [P,P̀,P̄,P̕,P̣,p,p̀,p̄,p̕,p̣,Ṕ,ṕ,Ṗ,ṗ] -> P
    { base: 'P', pattern: /(P|P̀|P̄|P̕|P̣|p|p̀|p̄|p̕|p̣|Ṕ|ṕ|Ṗ|ṗ)/g },
    // [Q,q] -> Q
    { base: 'Q', pattern: /[Qq]/g },
    // [R,R̆,R̥,R̥̄,r,r̆,r̥,r̥̄,Ŕ,ŕ,Ŗ,ŗ,Ř,ř,Ȓ,ȓ,Ṙ,ṙ,Ṛ,ṛ,Ṟ,ṟ] -> R
    { base: 'R', pattern: /(R|R̆|R̥|R̥̄|r|r̆|r̥|r̥̄|Ŕ|ŕ|Ŗ|ŗ|Ř|ř|Ȓ|ȓ|Ṙ|ṙ|Ṛ|ṛ|Ṟ|ṟ)/g },
    // [S,S̀,S̄,S̛̄,S̱,s,s̀,s̄,s̛̄,s̱,Ś,ś,Ŝ,ŝ,Ş,ş,Š,š,Ș,ș,Ṡ,ṡ,Ṣ,Ṣ̄,ṣ,ṣ̄] -> S
    { base: 'S', pattern: /(S|S̀|S̄|S̛̄|S̱|s|s̀|s̄|s̛̄|s̱|Ś|ś|Ŝ|ŝ|Ş|ş|Š|š|Ș|ș|Ṡ|ṡ|Ṣ|Ṣ̄|ṣ|ṣ̄)/g },
    // [T,T̀,T̄,T̈,T̕,T̛,t,t̀,t̄,t̕,t̛,Ţ,ţ,Ť,ť,Ŧ,ŧ,Ț,ț,Ṫ,ṫ,Ṭ,Ṭ̄,ṭ,ṭ̄,Ṯ,ṯ,ẗ] -> T
    { base: 'T', pattern: /(T|T̀|T̄|T̈|T̕|T̛|t|t̀|t̄|t̕|t̛|Ţ|ţ|Ť|ť|Ŧ|ŧ|Ț|ț|Ṫ|ṫ|Ṭ|Ṭ̄|ṭ|ṭ̄|Ṯ|ṯ|ẗ)/g },
    // [U,U̇,u,u̇,Ù,Ú,Û,Û̄,ù,ú,û,û̄,Ũ,ũ,Ū,ū,Ŭ,ŭ,Ů,ů,Ű,ű,Ų,ų,Ư,ư,Ǔ,ǔ,Ụ,Ụ̄,ụ,ụ̄,Ủ,ủ,Ứ,ứ,Ừ,ừ,Ử,ử,Ữ,ữ,Ự,ự] -> U
    {
        base: 'U',
        pattern: /(U|U̇|u|u̇|Ù|Ú|Û|Û̄|ù|ú|û|û̄|Ũ|ũ|Ū|ū|Ŭ|ŭ|Ů|ů|Ű|ű|Ų|ų|Ư|ư|Ǔ|ǔ|Ụ|Ụ̄|ụ|ụ̄|Ủ|ủ|Ứ|ứ|Ừ|ừ|Ử|ử|Ữ|ữ|Ự|ự)/g,
    },
    // [V,v] -> V
    { base: 'V', pattern: /[Vv]/g },
    // [W,w,Ŵ,ŵ,Ẁ,ẁ,Ẃ,ẃ,Ẅ,ẅ,Ẇ,ẇ] -> W
    { base: 'W', pattern: /[WwŴŵẀẁẂẃẄẅẆẇ]/g },
    // [X,x,Ẍ,ẍ] -> X
    { base: 'X', pattern: /[XxẌẍ]/g },
    // [Y,y,Ý,ý,ÿ,ÿ́,Ŷ,ŷ,Ÿ,Ȳ,ȳ,Ẏ,ẏ,Ỳ,ỳ,Ỵ,ỵ,Ỷ,ỷ,Ỹ,ỹ] -> Y
    { base: 'Y', pattern: /(Y|y|Ý|ý|ÿ|ÿ́|Ŷ|ŷ|Ÿ|Ȳ|ȳ|Ẏ|ẏ|Ỳ|ỳ|Ỵ|ỵ|Ỷ|ỷ|Ỹ|ỹ)/g },
    // [Z,Z̀,Z̄,Z̆,Z̈,Z̧,z,z̀,z̄,z̆,z̈,z̧,Ź,ź,Ż,ż,Ž,Ž̦,Ž̧,ž,ž̦,ž̧,Ʒ,Ǯ,ǯ,ʒ,Ẑ,ẑ,Ẓ,ẓ,Ẕ,ẕ] -> Z
    { base: 'Z', pattern: /(Z|Z̀|Z̄|Z̆|Z̈|Z̧|z|z̀|z̄|z̆|z̈|z̧|Ź|ź|Ż|ż|Ž|Ž̦|Ž̧|ž|ž̦|ž̧|Ʒ|Ǯ|ǯ|ʒ|Ẑ|ẑ|Ẓ|ẓ|Ẕ|ẕ)/g },
    // [Ä,Æ,ä,æ,Ǟ,ǟ,Ǣ,ǣ,Ǽ,ǽ,Ạ̈,ạ̈] -> AE
    { base: 'AE', pattern: /(Ä|Æ|ä|æ|Ǟ|ǟ|Ǣ|ǣ|Ǽ|ǽ|Ạ̈|ạ̈)/g },
    // [Å,å,Ǻ,ǻ] -> AA
    { base: 'AA', pattern: /[ÅåǺǻ]/g },
    // [Ö,Ø,ö,ø,Œ,œ,Ǿ,ǿ,Ȫ,ȫ,Ọ̈,ọ̈] -> OE
    { base: 'OE', pattern: /(Ö|Ø|ö|ø|Œ|œ|Ǿ|ǿ|Ȫ|ȫ|Ọ̈|ọ̈)/g },
    // [Ü,ü,Ǖ,ǖ,Ǘ,ǘ,Ǚ,ǚ,Ǜ,ǜ,Ụ̈,ụ̈] -> UE
    { base: 'UE', pattern: /(Ü|ü|Ǖ|ǖ|Ǘ|ǘ|Ǚ|ǚ|Ǜ|ǜ|Ụ̈|ụ̈)/g },
    // [Þ,þ] -> TH
    { base: 'TH', pattern: /[Þþ]/g },
    // [ß,ẞ] -> SS
    { base: 'SS', pattern: /[ßẞ]/g },
    // [Ĳ,ĳ] -> IJ
    { base: 'IJ', pattern: /[Ĳĳ]/g },
];

export function isDIN91379A(input: string): boolean {
    return DIN_91379A.test(input.normalize('NFC'));
}

/**
 * Replaces all normative characters according to the search-form replacement table in DIN-91379
 * Will not touch other characters
 */
export function toDIN91379SearchForm(input: string): string {
    let searchForm: string = input.normalize('NFC');
    for (const replacement of NORMATIVE_MAPPINGS) {
        searchForm = searchForm.replace(replacement.pattern, replacement.base);
    }

    return searchForm;
}

export function IsDIN91379A(): PropertyDecorator {
    return applyDecorators(
        Transform(({ value }: TransformFnParams) => (typeof value === 'string' ? value.normalize('NFC') : undefined)),
        IsString(),
        Matches(DIN_91379A),
    );
}

export function IsDIN91379AEXT(): PropertyDecorator {
    return applyDecorators(
        Transform(({ value }: TransformFnParams) => (typeof value === 'string' ? value.normalize('NFC') : undefined)),
        IsString(),
        Matches(DIN_91379A_EXT),
    );
}
