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
    const setting6_has0conf = d.setting6_has0conf;
    if (setting6_has0conf) {
      if (typeof setting6_has0conf != 'boolean') {
        throw new Error('expected a boolean value for this setting.');
      }
    }
    const setting7_randomize_recovery = d.randomize_recovery;
    if (setting7_randomize_recovery) {
      if (typeof setting7_randomize_recovery != 'boolean') {
        throw new Error('expected a boolean value for this setting.');
      }
    }

    return new Settings(
      setting1_hasNested,
      setting2_hasCustomGapLimit,
      setting3_hasDisabledRBF,
      setting4_hasPTM,
      setting6_has0conf,
      setting7_randomize_recovery
    );
  }

  static async fromData(
    setting1_hasNested?: boolean,
    setting2_hasCustomGapLimit?: boolean,
    setting3_hasDisabledRBF?: boolean,
    setting4_hasPTM?: boolean,
    setting6_has0conf?: boolean,
    setting7_randomize_recovery?: boolean
  ): Promise<Error | Settings> {
    return new Settings(
      setting1_hasNested,
      setting2_hasCustomGapLimit,
      setting3_hasDisabledRBF,
      setting4_hasPTM,
      setting6_has0conf,
      setting7_randomize_recovery
    );
  }
  setting1_hasNested?: boolean;
  setting2_hasCustomGapLimit?: boolean;
  setting3_hasDisabledRBF?: boolean;
  setting4_hasPTM?: boolean;
  setting6_has0conf?: boolean;
  setting7_randomize_recovery?: boolean;

  constructor(
    setting1_hasNested?: boolean,
    setting2_hasCustomGapLimit?: boolean,
    setting3_hasDisabledRBF?: boolean,
    setting4_hasPTM?: boolean,
    setting6_has0conf?: boolean,
    setting7_randomize_recovery?: boolean
  ) {
    this.setting1_hasNested = setting1_hasNested;
    this.setting2_hasCustomGapLimit = setting2_hasCustomGapLimit;
    this.setting3_hasDisabledRBF = setting3_hasDisabledRBF;
    this.setting4_hasPTM = setting4_hasPTM;
    this.setting6_has0conf = setting6_has0conf;
    this.setting7_randomize_recovery = setting7_randomize_recovery;
  }

  toDoc(): Docs.Settings {
    return {
      one: 1,
      setting1_hasNested: this.setting1_hasNested,
      setting2_hasCustomGapLimit: this.setting2_hasCustomGapLimit,
      setting3_hasDisabledRBF: this.setting3_hasDisabledRBF,
      setting4_hasPTM: this.setting4_hasPTM,
      setting6_has0conf: this.setting6_has0conf,
      setting7_randomize_recovery: this.setting7_randomize_recovery,
    };
  }
}
