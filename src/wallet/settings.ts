import * as Docs from './docs';

export default class Settings {
  static async fromDoc(d: any): Promise<Settings | Error> {
    if (typeof d !== 'object') {
      throw new Error('expected an object for config');
    }
    const setting1_hasNested = d.setting1_hasNested;
    if (setting1_hasNested) {
      if (typeof setting1_hasNested != 'boolean') {
        throw new Error('expected a boolean value for this setting.');
      }
    }
    const setting2_hasCustomGapLimit = d.setting2_hasCustomGapLimit;
    if (setting2_hasCustomGapLimit) {
      if (typeof setting2_hasCustomGapLimit != 'boolean') {
        throw new Error('expected a boolean value for this setting.');
      }
    }
    const setting3_hasDisabledRBF = d.setting3_hasDisabledRBF;
    if (setting3_hasDisabledRBF) {
      if (typeof setting3_hasDisabledRBF != 'boolean') {
        throw new Error('expected a boolean value for this setting.');
      }
    }
    const setting4_hasPTM = d.setting4_hasPTM;
    if (setting4_hasPTM) {
      if (typeof setting4_hasPTM != 'boolean') {
        throw new Error('expected a boolean value for this setting.');
      }
    }
    const setting5_has0conf = d.setting5_has0conf;
    if (setting5_has0conf) {
      if (typeof setting5_has0conf != 'boolean') {
        throw new Error('expected a boolean value for this setting.');
      }
    }

    return new Settings(setting1_hasNested, setting2_hasCustomGapLimit, setting3_hasDisabledRBF, setting4_hasPTM, setting5_has0conf);
  }

  static async fromData(
    setting1_hasNested?: boolean,
    setting2_hasCustomGapLimit?: boolean,
    setting3_hasDisabledRBF?: boolean,
    setting4_hasPTM?: boolean,
    setting5_has0conf?: boolean
  ): Promise<Error | Settings> {
    return new Settings(setting1_hasNested, setting2_hasCustomGapLimit, setting3_hasDisabledRBF, setting4_hasPTM, setting5_has0conf);
  }
  setting1_hasNested?: boolean;
  setting2_hasCustomGapLimit?: boolean;
  setting3_hasDisabledRBF?: boolean;
  setting4_hasPTM?: boolean;
  setting5_has0conf?: boolean;

  constructor(
    setting1_hasNested?: boolean,
    setting2_hasCustomGapLimit?: boolean,
    setting3_hasDisabledRBF?: boolean,
    setting4_hasPTM?: boolean,
    setting5_has0conf?: boolean
  ) {
    this.setting1_hasNested = setting1_hasNested;
    this.setting2_hasCustomGapLimit = setting2_hasCustomGapLimit;
    this.setting3_hasDisabledRBF = setting3_hasDisabledRBF;
    this.setting4_hasPTM = setting4_hasPTM;
    this.setting5_has0conf = setting5_has0conf;
  }

  toDoc(): Docs.Settings {
    return {
      one: 1,
      setting1_hasNested: this.setting1_hasNested,
      setting2_hasCustomGapLimit: this.setting2_hasCustomGapLimit,
      setting3_hasDisabledRBF: this.setting3_hasDisabledRBF,
      setting4_hasPTM: this.setting4_hasPTM,
      setting5_has0conf: this.setting5_has0conf,
    };
  }
}
