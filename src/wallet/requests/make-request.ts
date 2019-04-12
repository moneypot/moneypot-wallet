export class RequestError {
  public statusCode: number;
  public message: any;

  constructor(message: any, statusCode: number) {
    this.message = message;
    this.statusCode = statusCode;
  }
}

// if body does a post..
export default async function makeRequest<T>(url: string, body?: any): Promise<T | RequestError> {
  let fetchResult;

  try {
    fetchResult = await fetch(url, {
      method: body ? 'POST' : 'GET',
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    return new RequestError(err, 0);
  }

  let json = await fetchResult.json();

  if (fetchResult.status !== 200) {
    console.log('giving a fetch error');
    return new RequestError(json, fetchResult.status);
  }

  return json as T;
}
