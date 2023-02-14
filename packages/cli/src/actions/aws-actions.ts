import AWS = require('aws-sdk');


const awsConfig = {
  region: 'cn-northwest-1',
  accessKeyId : 'AKIA5SIH2FRV56C4I66G',
  secretAccessKey : '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'
}
const ec2: AWS.EC2 = new AWS.EC2(awsConfig);
const cloudformation: AWS.CloudFormation = new AWS.CloudFormation(awsConfig);
const sts: AWS.STS = new AWS.STS(awsConfig);

export class AWSActions {
  constructor() {}

  static async checkValidAWSIdentity(): Promise<
    AWS.STS.GetCallerIdentityResponse
  > {
    try {
      return await sts.getCallerIdentity().promise();
    } catch (error) {
      throw Error(
        'No valid identity set - please verify that credentials are set for your AWS Account'
      );
    }
  }

  static async getAllRegionsByName(): Promise<Array<Object>> {
    try {
      let regions: string[] = [];
      const result = await ec2.describeRegions({ AllRegions: true }).promise();

      regions = result
        .Regions!.sort((a, b) => a.RegionName!.localeCompare(b.RegionName!))
        .map((x) => {
          return x.RegionName!;
        });
      return regions;
    } catch (error) {
      throw Error(error);
    }
  }

  static async getAllStacksByName(): Promise<Array<Object>> {
    try {
      let stacks: any[];
      const result = await cloudformation.listStacks({}).promise();
      stacks = result
        .StackSummaries!.sort((a, b) =>
          a.StackName!.localeCompare(b.StackName!)
        )
        .map((x) => {
          return new Object({
            name: x.StackName,
          });
        });

      return stacks;
    } catch (error) {
      throw Error(error);
    }
  }

  static async getSSMParameter(key: string, region: string): Promise<string> {
    try {
      AWS.config.update({ region });
      const ssm = new AWS.SSM();
      const result = await ssm
        .getParameter({
          Name: key,
          WithDecryption: true,
        })
        .promise();
      return (result.$response.data as AWS.SSM.GetParameterResult).Parameter!
        .Value!;
    } catch (error) {
      throw new Error(
        'Cannot request SSM Parameter Value for ' +
          process.env.authPath +
          ' - please ensure that key is available in AWS SSM - further details: ' +
          error.message
      );
    }
  }

  static async putSSMParameter(
    key: string,
    value: string,
    region: string
  ): Promise<void> {
    try {
      AWS.config.update({ region });
      const ssm = new AWS.SSM();
      const result = await ssm
        .putParameter({
          Name: key,
          Value: value,
          Type: 'SecureString',
          Overwrite: true,
        })
        .promise();
      console.log(result);
    } catch (error) {
      throw new Error(
        'Cannot put SSM Parameter Value for ' +
          process.env.authPath +
          ' - further details: ' +
          error.message
      );
    }
  }

  static async deleteSSMParameter(key: string, region: string): Promise<void> {
    try {
      AWS.config.update({ region });
      const ssm = new AWS.SSM();
      await ssm
        .deleteParameter({
          Name: key,
        })
        .promise();
      return;
    } catch (error) {
      throw new Error(
        'Cannot delete SSM Parameter Value for ' +
          process.env.authPath +
          ' - further details: ' +
          error.message
      );
    }
  }
}
