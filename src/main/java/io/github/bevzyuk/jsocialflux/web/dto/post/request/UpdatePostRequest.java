package io.github.bevzyuk.jsocialflux.web.dto.post.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdatePostRequest {
    private String content;
    private boolean contentPresent;

    @JsonProperty("content")
    public void setContent(String content) {
        this.content = content;
        this.contentPresent = true;
    }

    public String getContent() { return content; }
    public boolean isContentPresent() { return contentPresent; }
}
