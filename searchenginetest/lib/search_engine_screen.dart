import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class SearchEngineScreen extends StatefulWidget {
  final String engine;

  const SearchEngineScreen({Key? key, required this.engine}) : super(key: key);

  @override
  State<SearchEngineScreen> createState() => _SearchEngineScreenState();
}

class _SearchEngineScreenState extends State<SearchEngineScreen> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    // WebViewController 설정: JavaScript 허용 및 HTML 컨텐츠 로드
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadHtmlString(
        getHtmlContent(widget.engine),
        baseUrl: widget.engine == 'agoda' ? 'https://cdn0.agoda.net/' : null,
      );
  }

  String getHtmlContent(String engine) {
    switch (engine) {
      case 'agoda':
        return '''
<!DOCTYPE html>
<html>
<head>
  <base href="https://cdn0.agoda.net/">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="adgshp272029740"></div>
  <script type="text/javascript" src="//cdn0.agoda.net/images/sherpa/js/sherpa_init1_08.min.js"></script>
  <script type="text/javascript">
    var stg = new Object();
    stg.crt = "4780462508860";
    stg.version = "1.04";
    stg.id = stg.name = "adgshp272029740";
    stg.width = "100%";
    stg.height = "100%";
    stg.ReferenceKey = "z1PdN+PoaTWERV7EH5sarA==";
    stg.Layout = "TallCalendar";
    stg.Language = "ko-kr";
    stg.Cid = "1940487";
    stg.DestinationName = "";
    stg.OverideConf = false;
    new AgdSherpa(stg).initialize();
  </script>
</body>
</html>
''';
      case 'kayak':
        return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    html, body { 
      margin: 0; 
      padding: 0; 
      width: 100%; 
      height: 100%; 
      overflow: hidden; 
    }
  </style>
</head>
<body>
  <div id="kayak" 
       data-affiliate-id="kan_316435_592528" 
       data-theme="light" 
       data-language-code="ko" 
       data-country-code="KR" 
       data-currency-code="KRW" 
       data-vertical="flights" 
       data-vertical-list="flights,hotels" 
       data-fill-trip-type="2" 
       data-label="" 
       data-disable-compare-to="true">
  </div>
  <script src="https://www.kayak.com/search-widget/script/direct/kayak"></script>
</body>
</html>
''';
      case 'hotelscombined':
        return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    html, body { 
      margin: 0; 
      padding: 0; 
      width: 100%; 
      height: 100%; 
      overflow: hidden; 
    }
  </style>
</head>
<body>
  <div id="hotelscombined" 
       data-affiliate-id="kan_316435_592528" 
       data-theme="light" 
       data-language-code="ko" 
       data-country-code="KR" 
       data-currency-code="KRW" 
       data-vertical="hotels" 
       data-vertical-list="hotels,flights" 
       data-fill-trip-type="2" 
       data-label="" 
       data-disable-compare-to="true">
  </div>
  <script src="https://www.hotelscombined.com/search-widget/script/direct/hotelscombined"></script>
</body>
</html>
''';
      case 'trip_hotels':
        return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    html, body { 
      margin: 0; 
      padding: 0; 
      width: 100%; 
      height: 100%; 
      overflow: hidden; 
    }
    iframe { 
      border: 0; 
      width: 100%; 
      height: 100%; 
    }
  </style>
</head>
<body>
<iframe border="0" src="https://kr.trip.com/partners/ad/S2652911?Allianceid=5362764&SID=115891490&trip_sub1=app_searchengine_hotels" frameborder="0" scrolling="no" style="border:none" id="S2652911"></iframe>
</body>
</html>
''';
      case 'trip_flights':
        return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    html, body { 
      margin: 0; 
      padding: 0; 
      width: 100%; 
      height: 100%; 
      overflow: hidden; 
    }
    iframe { 
      border: 0; 
      width: 100%; 
      height: 100%; 
    }
  </style>
</head>
<body>
  <iframe src="https://kr.trip.com/partners/ad/S2612073?Allianceid=5362764&SID=115891490&trip_sub1=app_searchengine_flights" frameborder="0" scrolling="no" id="S2612073"></iframe>
</body>
</html>
''';
      case 'skyscanner':
        return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    html, body { 
      margin: 0; 
      padding: 0; 
      width: 100%; 
      height: 100%; 
      overflow: hidden; 
    }
    #skyscanner-widget-container {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="skyscanner-widget-container">
    <div
      data-skyscanner-widget="MultiVerticalWidget"
      data-locale="ko-KR"
      data-market="KR"
      data-currency="KRW"
      data-media-partner-id="5776943"
      data-flight-type="return"
      data-arrow-icon="false"
      data-button-text-size="1.3"
      data-button-colour="#1D72FF"
    ></div>
  </div>
  <script src="https://widgets.skyscanner.net/widget-server/js/loader.js" async></script>
</body>
</html>
''';
      default:
        return '<html><body><p>검색 엔진을 불러올 수 없습니다.</p></body></html>';
    }
  }

  @override
  Widget build(BuildContext context) {
    // AppBar와 양쪽 상단의 패딩을 제외한 높이 계산
    final availableHeight =
        MediaQuery.of(context).size.height - kToolbarHeight - 32;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: Text('${widget.engine} 검색')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Card(
          color: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              height: availableHeight,
              child: WebViewWidget(controller: _controller),
            ),
          ),
        ),
      ),
    );
  }
}