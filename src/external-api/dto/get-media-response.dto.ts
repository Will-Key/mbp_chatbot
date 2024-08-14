export class FileDto {
    id: string
    link: string
}

export class GetMediaResponseDto {
    files: FileDto[]
}