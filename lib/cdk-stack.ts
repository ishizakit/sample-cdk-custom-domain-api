import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as certificatemanager from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as route53Tragts from '@aws-cdk/aws-route53-targets';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // RestAPIを作成
    const restAPI = new apigateway.RestApi(
      this,
      'APIGateway',
      {
        restApiName: 'Example',
        endpointTypes: [apigateway.EndpointType.REGIONAL],
      },
    );

    // リソースを作成
    restAPI.root
      .resourceForPath('')
      .addMethod('GET');

    // 既存のSSL証明書を取得
    const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        'RestAPICertificate',
        'arn:aws:acm:ap-northeast-1:000000000000:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // 証明書のARN
    );

    // APIにカスタムドメインを設定
    restAPI.addDomainName(
      'CustomDomain',
      {
        domainName: 'api.example.com',
        certificate: certificate,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        endpointType: apigateway.EndpointType.REGIONAL,
      }
    );

    // ホストゾーンを取得
    const hostZone = route53.PublicHostedZone.fromHostedZoneAttributes(
      this,
      `HostZone`,
      {
        hostedZoneId: 'XXXXXXXXXXXXXXXXXXXX',
        zoneName: 'example.com',
      }
    );

    // エイリアスレコードを作成
    new route53.ARecord(
      this,
      'ARecord',
      {
        zone: hostZone,
        recordName: 'api.example.com',
        target: route53.RecordTarget.fromAlias(
            new route53Tragts.ApiGateway(restAPI),
        ),
      }
    );
  }
}
