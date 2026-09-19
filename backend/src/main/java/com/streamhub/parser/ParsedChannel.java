package com.streamhub.parser;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedChannel {
    private String name;
    private String tvgId;
    private String tvgName;
    private String tvgLogo;
    private String groupTitle;
    private String streamUrl;
}
