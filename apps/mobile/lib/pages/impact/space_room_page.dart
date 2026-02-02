import 'dart:async';

import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:thittam1hub/models/space.dart';
import 'package:thittam1hub/supabase/space_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';

class SpaceRoomPage extends StatefulWidget {
  final Space space;

  const SpaceRoomPage({Key? key, required this.space}) : super(key: key);

  @override
  State<SpaceRoomPage> createState() => _SpaceRoomPageState();
}

class _SpaceRoomPageState extends State<SpaceRoomPage> {
  // Logging
  static final _log = LoggingService.instance;
  static const String _tag = 'SpaceRoomPage';
  
  // Use singleton pattern for service access
  final SpaceService _spaceService = SpaceService.instance;
  
  RtcEngine? _engine;
  bool _isSpeaker = true; // For now, everyone is a speaker
  bool _isMuted = false;
  bool _isInitializing = true;
  String? _initError;
  
  // Agora credentials fetched from Edge Function
  String? _agoraAppId;
  String? _agoraToken;

  late final Stream<List<SpaceSpeaker>> _speakersStream;
  late final Stream<List<SpaceAudience>> _audienceStream;

  @override
  void initState() {
    super.initState();
    _speakersStream = _spaceService.getSpeakersStream(widget.space.id);
    _audienceStream = _spaceService.getAudienceStream(widget.space.id);
    _initAgora();
  }

  /// Fetch Agora credentials from Edge Function
  Future<bool> _fetchAgoraCredentials() async {
    try {
      final response = await SupabaseConfig.client.functions.invoke(
        'agora-token',
        body: {
          'channelName': widget.space.id,
          'uid': 0,
          'role': _isSpeaker ? 'publisher' : 'subscriber',
        },
      );
      
      if (response.status != 200) {
        _log.error('Failed to fetch Agora token: ${response.status}', tag: _tag);
        return false;
      }
      
      final data = response.data as Map<String, dynamic>;
      _agoraAppId = data['appId'] as String?;
      _agoraToken = data['token'] as String?;
      
      if (_agoraAppId == null || _agoraToken == null) {
        _log.error('Invalid Agora credentials received', tag: _tag);
        return false;
      }
      
      _log.debug('Agora credentials fetched successfully', tag: _tag);
      return true;
    } catch (e, stackTrace) {
      _log.error('Error fetching Agora credentials', tag: _tag, error: e, stackTrace: stackTrace);
      return false;
    }
  }

  Future<void> _initAgora() async {
    try {
      // Request microphone permission
      final micStatus = await Permission.microphone.request();
      if (!micStatus.isGranted) {
        setState(() {
          _isInitializing = false;
          _initError = 'Microphone permission is required to join the Space.';
        });
        return;
      }

      // Fetch credentials from Edge Function
      final credentialsOk = await _fetchAgoraCredentials();
      if (!credentialsOk || _agoraAppId == null || _agoraToken == null) {
        setState(() {
          _isInitializing = false;
          _initError = 'Unable to connect to audio service. Please try again.';
        });
        return;
      }

      // Initialize Agora engine
      _engine = createAgoraRtcEngine();
      await _engine!.initialize(RtcEngineContext(appId: _agoraAppId!));

      _engine!.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (connection, elapsed) {
            _log.debug('Successfully joined channel: ${connection.channelId}', tag: _tag);
            _spaceService.joinSpace(widget.space.id, asSpeaker: _isSpeaker);
          },
          onUserJoined: (connection, remoteUid, elapsed) {
            _log.debug('Remote user joined: $remoteUid', tag: _tag);
          },
          onUserOffline: (connection, remoteUid, reason) {
            _log.debug('Remote user left: $remoteUid', tag: _tag);
          },
          onError: (err, msg) {
            _log.error('Agora error: $err - $msg', tag: _tag);
          },
        ),
      );

      await _engine!.joinChannel(
        token: _agoraToken!,
        channelId: widget.space.id,
        uid: 0, // 0 means Agora will assign a UID
        options: ChannelMediaOptions(
          clientRoleType: _isSpeaker ? ClientRoleType.clientRoleBroadcaster : ClientRoleType.clientRoleAudience,
          channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
        ),
      );

      if (mounted) {
        setState(() {
          _isInitializing = false;
        });
      }
    } catch (e, stackTrace) {
      _log.error('Failed to initialize Agora', tag: _tag, error: e, stackTrace: stackTrace);
      if (mounted) {
        setState(() {
          _isInitializing = false;
          _initError = 'Failed to join the Space. Please try again.';
        });
      }
    }
  }

  @override
  void dispose() {
    _leaveSpace();
    super.dispose();
  }

  Future<void> _leaveSpace() async {
    try {
      if (_engine != null) {
        await _engine!.leaveChannel();
        await _engine!.release();
        _engine = null;
      }
      await _spaceService.leaveSpace(widget.space.id);
    } catch (e) {
      _log.error('Error leaving space', tag: _tag, error: e);
    }
    if (mounted) {
      context.pop();
    }
  }

  Future<void> _toggleMute() async {
    if (_engine == null) return;
    
    setState(() {
      _isMuted = !_isMuted;
    });
    await _engine!.muteLocalAudioStream(_isMuted);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.space.topic),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _leaveSpace,
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isInitializing) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Connecting to Space...'),
          ],
        ),
      );
    }

    if (_initError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Theme.of(context).colorScheme.error),
              const SizedBox(height: 16),
              Text(
                _initError!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isInitializing = true;
                    _initError = null;
                  });
                  _initAgora();
                },
                child: const Text('Retry'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.pop(),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Text('Speakers', style: Theme.of(context).textTheme.titleLarge),
        ),
        _buildSpeakersGrid(),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Text('Audience', style: Theme.of(context).textTheme.titleLarge),
        ),
        _buildAudienceGrid(),
        const Spacer(),
        _buildControls(),
      ],
    );
  }

  Widget _buildSpeakersGrid() {
    return StreamBuilder<List<SpaceSpeaker>>(
      stream: _speakersStream,
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        final speakers = snapshot.data!;
        return GridView.builder(
          shrinkWrap: true,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4),
          itemCount: speakers.length,
          itemBuilder: (context, index) {
            final speaker = speakers[index];
            return Column(
              children: [
                const CircleAvatar(radius: 30), // Placeholder for user avatar
                const SizedBox(height: 8),
                Text(speaker.userId, overflow: TextOverflow.ellipsis), // Placeholder for user name
                if (speaker.isMuted) const Icon(Icons.mic_off, size: 16),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildAudienceGrid() {
    return StreamBuilder<List<SpaceAudience>>(
      stream: _audienceStream,
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox.shrink();
        final audience = snapshot.data!;
        return GridView.builder(
          shrinkWrap: true,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 5),
          itemCount: audience.length,
          itemBuilder: (context, index) {
            final member = audience[index];
            return const CircleAvatar(radius: 25); // Placeholder
          },
        );
      },
    );
  }

  Widget _buildControls() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          ElevatedButton.icon(
            onPressed: _leaveSpace,
            icon: const Icon(Icons.call_end),
            label: const Text('Leave Quietly'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          ),
          if (_isSpeaker)
            IconButton(
              icon: Icon(_isMuted ? Icons.mic_off : Icons.mic),
              onPressed: _toggleMute,
              iconSize: 32,
            ),
        ],
      ),
    );
  }
}
