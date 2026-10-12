import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosRequestConfig } from "axios";
import { firstValueFrom } from "rxjs";
import { CoreResponse } from "src/common/core-response.interface";
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

  public async get<T>(uri: string, config?: AxiosRequestConfig): Promise<CoreResponse<T>> {
    const { data } = await firstValueFrom(
      this.httpService.get<unknown>(this.coreUrl + uri, config),
    );
    return convertKeysToCamelCase<CoreResponse<T>>(data);
  }

  public async post<T>(uri: string, body?: unknown, config?: AxiosRequestConfig): Promise<CoreResponse<T>> {
    const { data } = await firstValueFrom(
      this.httpService.post<unknown>(this.coreUrl + uri, body, config),
    );

    return convertKeysToCamelCase<CoreResponse<T>>(data);
  }

  public async patch<T>(uri: string, body?: unknown, config?: AxiosRequestConfig): Promise<CoreResponse<T>> {
    const { data } = await firstValueFrom(
      this.httpService.patch<unknown>(this.coreUrl + uri, body, config),
    );

    return convertKeysToCamelCase<CoreResponse<T>>(data);
  }

  public async delete<T>(uri: string, config?: AxiosRequestConfig): Promise<CoreResponse<T>> {
    const { data } = await firstValueFrom(
      this.httpService.delete<unknown>(this.coreUrl + uri, config),
    );

    return convertKeysToCamelCase<CoreResponse<T>>(data);
  }
}
