package com.vieweat.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface IFileUploader {
    String uploadFile(MultipartFile file) throws IOException;
}
