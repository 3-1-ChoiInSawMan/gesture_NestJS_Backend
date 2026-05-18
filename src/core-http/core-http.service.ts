import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosRequestConfig } from "axios";
import { firstValueFrom } from "rxjs";
import { convertKeysToCamelCase } from "src/utils/convert-camel";

@Injectable()
export class CoreHttpService {
  private coreUrl: string = "";
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.coreUrl = configService.getOrThrow<string>("SPRING_SERVER_URL");
  };

  /**
   * Core 서버 URI 엔드포인트로 GET 요청을 전송합니다.
   * @param uri "/example/uri" => coreBaseUrl/api/v1/example/uri
   * @param config 
   * @returns data: T
   */
  public async get<T>(uri: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await firstValueFrom(
      this.httpService.get<unknown>(this.coreUrl + uri, config),
    );
    return convertKeysToCamelCase<T>(data);
  }

  /**
   * Core 서버 URI 엔드포인트로 POST 요청을 전송합니다.
   * @param uri "/example/uri" => coreBaseUrl/api/v1/example/uri
   * @param body 
   * @param config 
   * @returns data: T
   */
  public async post<T>(uri: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await firstValueFrom(
      this.httpService.post<unknown>(this.coreUrl + uri, body, config),
    );

    return convertKeysToCamelCase<T>(data);
  }

  /**
   * Core 서버 URI 엔드포인트로 PATCH 요청을 전송합니다.
   * @param uri "/example/uri" => coreBaseUrl/api/v1/example/uri
   * @param body 
   * @param config 
   * @returns data: T
   */
  public async patch<T>(uri: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await firstValueFrom(
      this.httpService.patch<unknown>(this.coreUrl + uri, body, config),
    );

    return convertKeysToCamelCase<T>(data);
  }

  /**
   * Core 서버 URI 엔드포인트로 DELETE 요청을 전송합니다.
   * @param uri "/example/uri" => coreBaseUrl/api/v1/example/uri
   * @param config 
   * @returns data: T
   */
  public async delete<T>(uri: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await firstValueFrom(
      this.httpService.delete<unknown>(this.coreUrl + uri, config),
    );

    return convertKeysToCamelCase<T>(data);
  }
}